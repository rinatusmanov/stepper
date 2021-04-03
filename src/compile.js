
import utils from "./utils.js";

function ToType(value, type) {
    switch (type) {
        case utils.variable_types.int:
            const intParsed = parseInt(value);
            return intParsed ? intParsed : 0;
        case utils.variable_types.float:
            const floatParsed = parseFloat(value);
            return floatParsed ? floatParsed : 0.0;
        case utils.variable_types.bool:
            return Boolean(value);
        default:
            return JSON.stringify(value);
    }
}

function tab(n) {
    let result = "";
    for (let index = 0; index < n; index++) {
        result += "	"
    }
    return result;
}

function variables(variableSlice) {
    let result = `var env = map[string]map[string]interface{}{
`;
    for (let i = 0; i < variableSlice.length; i++) {
        const element = variableSlice[i];
        result += `${tab(1)}//тип переменной ${element.type}
${tab(1)}${JSON.stringify(element.name)}: {
`
        const env = Object.keys(element.data);
        for (let ii = 0; ii < env.length; ii++) {
            const key = env[ii];
            if (key == "type" || key == "name") continue;
            result += `${tab(2)}${JSON.stringify(key)}:${ToType(element.data[key], element.type)},
`
        }
        result += `${tab(1)}},
`

    }
    result += `}
`
    return result;
}
function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


function steps(stepSlice, connections, variablesIn) {
    let result = `package main

import (
${tab(1)}"fmt"
${tab(1)}"strconv"
${tab(1)}"sync"
)

func only_to_compile() {
${tab(1)}_, _ = strconv.ParseInt("", 64, 10)
${tab(1)}fmt.Println(sync.Once{})
}

` + variables(variablesIn);
    let logic = `package main

import (
${tab(1)}"database/sql"
${tab(1)}"fmt"
)
    
func init() {
`;
    connections.forEach(conn => {
        logic += `${tab(1)}if db, errDb := sql.Open("${conn.type}",fmt.Sprint(getVar("${conn.variable.name}")) ); errDb == nil {
${tab(2)}globalLogger.Info("${conn.name} is connected")
${tab(2)}connection["${conn.name}"] = db
${tab(1)}} else {
${tab(2)}globalLogger.Error("${conn.name} not connected", errDb)
${tab(1)}}
`
    });
    logic += `}
`
    // console.log(stepSlice)
    stepSlice.forEach(step => {
        result += `// Структура для канала """${step.uuid}_CHANNEL""", данный канал
// обслуживает шаг """${step.title}""", логика записи в канал 
// предствлена в функции """${step.uuid}_LOGIC"""
type ${step.uuid}_STRUCT struct {
`;
        step.output.forEach(param => {
            let type = param.type;
            type = type == utils.variable_types.float ? 'float64' : type;
            type = type == utils.variable_types.int ? 'int64' : type;
            result += `${tab(1)}// Поле ${param.name}
${tab(1)}${param.uuid} ${type}
`
        });
        step.thread_count = step.thread_count - 1 + 1;
        if (!step.thread_count) {
            step.thread_count = 1
        }
        step.record_count = step.record_count - 1 + 1;
        if (!step.record_count) {
            step.record_count = 1
        }
        result += `}

var (
${tab(1)}// Оригинальный канал в который будут падать данные из """${step.uuid}_LOGIC"""
${tab(1)}${step.uuid}_CHANNEL           = make(chan ${step.uuid}_STRUCT, 1000000)
${tab(1)}// Массив дублей канала """${step.uuid}_CHANNEL""" в который будут падать данные из """${step.uuid}_CHANNEL"""
${tab(1)}${step.uuid}_CHANNEL_SLICE     []chan ${step.uuid}_STRUCT
${tab(1)}// Мапа где хранятся ссылки на каналы из """${step.uuid}_CHANNEL_SLICE"""
${tab(1)}${step.uuid}_CHANNEL_MAP = make(map[string]chan ${step.uuid}_STRUCT)
${tab(1)}// Количество писателей
${tab(1)}${step.uuid}_CHANNEL_WRITER_COUNT int
${tab(1)}// Mutex который защищает для переменную """${step.uuid}_CHANNEL_DUBLICATE_COUNT""" закрытия всех каналов
${tab(1)}${step.uuid}_CHANNEL_WRITER_COUNT_MUTEX sync.Mutex
${tab(1)}// Количество потоков шага """${step.title}"""
${tab(1)}${step.uuid}_LOGIC_THREAD_COUNT int = ${step.thread_count}
${tab(1)}// Количество записей для одномоментной обработки """${step.title}"""
${tab(1)}${step.uuid}_LOGIC_RECORD_COUNT int = ${step.record_count}
)

// Функция дает доступ к исходящему каналу и добавляет единичку к количеству писателей в канал
func ${step.uuid}_CHANNEL_GET() chan ${step.uuid}_STRUCT {
${tab(1)}${step.uuid}_CHANNEL_WRITER_COUNT_MUTEX.Lock()
${tab(1)}defer ${step.uuid}_CHANNEL_WRITER_COUNT_MUTEX.Unlock()
${tab(1)}${step.uuid}_CHANNEL_WRITER_COUNT++
${tab(1)}return ${step.uuid}_CHANNEL
}

// Функция закрывает исходящий канал
func ${step.uuid}_CHANNEL_CLOSE() {
${tab(1)}${step.uuid}_CHANNEL_WRITER_COUNT_MUTEX.Lock()
${tab(1)}defer ${step.uuid}_CHANNEL_WRITER_COUNT_MUTEX.Unlock()
${tab(1)}${step.uuid}_CHANNEL_WRITER_COUNT--
${tab(1)}if ${step.uuid}_CHANNEL_WRITER_COUNT == 0 {
${tab(2)}select {
${tab(2)}case <-${step.uuid}_CHANNEL:
${tab(3)}return
${tab(2)}default:
${tab(3)}globalLogger.Info("channel for ${step.uuid}(step ${step.title}) is closing")
${tab(3)}close(${step.uuid}_CHANNEL)
${tab(2)}}
${tab(1)}}
}

// Функция создает дубликат канала """${step.uuid}_CHANNEL"""
func ${step.uuid}_CHANNEL_CREATE_DUBLICATE_IF_NOT_EXISTS(funcUUID string) chan ${step.uuid}_STRUCT {
${tab(1)}${step.uuid}_CHANNEL_WRITER_COUNT_MUTEX.Lock()
${tab(1)}defer ${step.uuid}_CHANNEL_WRITER_COUNT_MUTEX.Unlock()
${tab(1)}if ch, ok := ${step.uuid}_CHANNEL_MAP[funcUUID]; ok {
${tab(2)}return ch
${tab(1)}}
${tab(1)}globalLogger.Info("create new duplicate ${step.uuid}_CHANNEL for "+ funcUUID)
${tab(1)}resultChan := make(chan ${step.uuid}_STRUCT, 1000000)
${tab(1)}${step.uuid}_CHANNEL_SLICE = append(${step.uuid}_CHANNEL_SLICE, resultChan)
${tab(1)}${step.uuid}_CHANNEL_MAP[funcUUID] = resultChan
${tab(1)}return resultChan
}


// Вешаем обработчик который будет клонировать входящий поток из канала по всем слушателям ${step.uuid}_CHANNEL
func init() {
${tab(1)}globalGourotineWaitGroup.Add(1)
${tab(1)}// Запускаем бесконечную горутину, которая работает до тех пор пока канал """${step.uuid}_CHANNEL""" открыт
${tab(1)}go func() {
${tab(2)}defer globalGourotineWaitGroup.Done()    
${tab(2)}for {
${tab(3)}// Читаем из канала """${step.uuid}_CHANNEL"""
${tab(3)}select {
${tab(3)}case data, opened := <-${step.uuid}_CHANNEL:
${tab(4)}// Если канал закрыт то закрываем все связзаные дубли каналы из """${step.uuid}_CHANNEL_SLICE"""
${tab(4)}if !opened {
${tab(5)}globalLogger.Info(\`channel ${step.uuid}_CHANNEL(output from step ${JSON.stringify(step.title)}) is closed, closing child channels\`)
${tab(5)}for _, ch := range ${step.uuid}_CHANNEL_SLICE {
${tab(6)}close(ch)
${tab(5)}}
${tab(5)}return
${tab(4)}}
${tab(4)}// Если пришли данные из """${step.uuid}_CHANNEL""" то пересылаем их по всем каналам дублям
${tab(4)}// из """${step.uuid}_CHANNEL_SLICE"""
${tab(4)}for _, ch := range ${step.uuid}_CHANNEL_SLICE {
${tab(5)}ch <- data
${tab(4)}}
${tab(3)}}
${tab(2)}}
${tab(1)}}()
}
`
        if (step.input_conditions.length && step.input_conditions.length > 0) {
            result += `var (
`
            step.input_conditions.forEach((cond, index) => {

                let type = cond.input_variable.type;
                type = type == utils.variable_types.float ? 'float64' : type;
                type = type == utils.variable_types.int ? 'int64' : type;
                switch (cond.condition_source.type) {
                    case utils.source.text:
                        let valueCondition = "";
                        switch (cond.input_variable.type) {
                            case utils.variable_types.string:
                                valueCondition = JSON.stringify(cond.condition_source.text);
                                break;
                            case utils.variable_types.int:
                                valueCondition = cond.condition_source.int;
                                break;
                            case utils.variable_types.float:
                                valueCondition = cond.condition_source.float;
                                break;
                            case utils.variable_types.bool:
                                valueCondition = cond.condition_source.bool
                                break;
                        }
                        result += `${tab(1)}${step.uuid}_INPUT_CONDITION_${index} ${tab(1)} ${type} = ${valueCondition} // сравнение для параметра """${cond.input_variable.name}""" из канала """${step.inputstep.uuid}_CHANNEL"""
`
                        break;
                    case utils.source.variable:
                        result += `${tab(1)}${step.uuid}_INPUT_CONDITION_${index} ${tab(1)}`

                        switch (type) {
                            case 'string':
                                result += ` = fmt.Sprint(getVar("${cond.input_variable.variable.name}"))`;
                                break;
                            case 'bool':
                                result += `,_ = strconv.ParseBool(fmt.Sprint(getVar("${cond.input_variable.variable.name}")))`;
                                break;
                            case 'int64':
                                result += `,_ = strconv.ParseInt(fmt.Sprint(getVar("${cond.input_variable.variable.name}")), 64, 10)`;
                                break;
                            case 'float64':
                                result += `,_ = strconv.ParseFloat(fmt.Sprint(getVar("${cond.input_variable.variable.name}")),64)`;
                                break;
                            default:
                                result += ` ${type}`
                                break;
                        }
                        result += ` // сравнение для параметра """${cond.input_variable.name}""" из канала """${step.inputstep.uuid}_CHANNEL""" с переменной окружения """${cond.input_variable.variable.name}"""
`;
                        break;
                }
            })
            result += `)

                `
        }
        result += `func ${step.uuid}_LOGIC() {
${tab(1)}globalLogger.Info("start ${step.uuid}_LOGIC(${step.title})")
${tab(1)}defer globalLogger.Info("stop ${step.uuid}_LOGIC(${step.title})")
${tab(1)}defer globalGourotineWaitGroup.Done()
${tab(1)}globalLogger.Info("run ${step.uuid}_LOGIC(${step.title})")
${tab(1)}output_channel:= ${step.uuid}_CHANNEL_GET()
${tab(1)}defer ${step.uuid}_CHANNEL_CLOSE()
${tab(1)}globalStartWaitGroup.Wait()
`
        if (step.inputstep && step.inputstep.uuid && step.inputstep.uuid != "") {
            result += `${tab(1)} ch:= ${step.inputstep.uuid}_CHANNEL_CREATE_DUBLICATE_IF_NOT_EXISTS("${step.uuid}")
${tab(1)}var data []${step.inputstep.uuid}_STRUCT
${tab(1)}defer ${step.uuid}_step_logic(data, output_channel)
${tab(1)} for {
${tab(2)}select {
${tab(2)}case data_from_channel, opened := <-ch:
${tab(3)}if !opened {
${tab(4)}return
${tab(3)}}
`
            step.input_conditions.forEach((cond, index) => {
                result += `${tab(2)}if data_from_channel.${cond.input_variable.uuid} ${cond.condition.value} ${step.uuid}_INPUT_CONDITION_${index} {
${tab(3)}continue
${tab(2)}}
`
            });
            result += `${tab(3)} data = append(data, data_from_channel)
                    ${tab(3)} if len(data) > ${step.uuid}_LOGIC_RECORD_COUNT {
                        ${tab(5)} ${step.uuid}_step_logic(data, output_channel)
                        ${tab(5)} data = []${step.inputstep.uuid}_STRUCT{ }
                        ${tab(4)}
                    }
                    ${tab(3)}
                }
                ${tab(2)}
            }
        }

`;
            logic += `// Шаг ${step.title}
func ${step.uuid}_step_logic(data []${step.inputstep.uuid}_STRUCT, ch chan ${step.uuid}_STRUCT) {

}
        
`
        } else {
            logic += `// Шаг ${step.title}
func ${step.uuid}_step_logic(ch chan ${step.uuid}_STRUCT) {

}
            
`
            result += `${tab(1)} ${step.uuid}_step_logic(output_channel)
    }

`;
        }
        result += `func init() {
${tab(1)}for i := 0; i < ${step.uuid}_LOGIC_THREAD_COUNT; i++ {
${tab(2)}globalGourotineWaitGroup.Add(1)
${tab(2)}go ${step.uuid}_LOGIC()
${tab(1)}}
}

`

    });
    return { steps: result, logic };
}

export default {
    variables,
    steps,
    tab,
    download,
};
