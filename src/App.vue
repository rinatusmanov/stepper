<template>
  <div id="app">
    <header>
      <input
        type="file"
        ref="fileloader"
        style="display: none"
        @change="loadProject"
      />
      <div class="button green" @click="$refs.fileloader.click()">
        Загрузить проект
      </div>
      <div class="button green" @click="saveProject">Сохранить проект</div>
    </header>
    <div class="envs">
      <table>
        <caption>
          <div
            class="button mini green"
            @click="envs.push({ name: 'new environment' })"
          >
            Добавить среду развертывания
          </div>
        </caption>
        <tr v-for="(env, indexEnv) in envs" :key="indexEnv">
          <td><input type="text" v-model="env.name" /></td>
          <td>
            <div class="button mini red" @click="envs.splice(indexEnv, 1)">
              Удалить
            </div>
          </td>
        </tr>
      </table>
    </div>
    <div class="variables">
      <table>
        <caption>
          <div
            class="button mini green"
            @click="
              variables.push({
                name: 'new variable',
                type: utils.variable_types.string,
                data: { default: '' },
              })
            "
          >
            Добавить переменную
          </div>
        </caption>
        <tr>
          <td>Название перменной</td>
          <td>Тип переменной</td>
          <td>default</td>
          <td v-for="(env, indexEnv) in envs" :key="indexEnv">
            {{ env.name }}
          </td>
        </tr>
        <tr v-for="(variable, indexVariable) in variables" :key="indexVariable">
          <td>
            <input type="text" v-model="variable.name" />
          </td>
          <td>
            <select v-model="variable.type">
              <option
                v-for="type in utils.variable_types"
                :key="type"
                :value="type"
              >
                {{ type }}
              </option>
            </select>
            <div
              class="button mini red"
              @click="variables.splice(indexVariable, 1)"
            >
              Удалить переменную
            </div>
          </td>
          <td>
            <template v-if="variable.type == utils.variable_types.string">
              <input type="text" v-model="variable.data.default" />
            </template>
            <template v-else-if="variable.type == utils.variable_types.int">
              <input type="number" v-model="variable.data.default" />
            </template>
            <template v-else-if="variable.type == utils.variable_types.float">
              <input
                type="number"
                step="0.01"
                v-model="variable.data.default"
              />
            </template>
            <template v-else>
              <select v-model="variable.data.default">
                <option :value="true">true</option>
                <option :value="false">false</option>
              </select>
            </template>
          </td>
          <td v-for="(env, indexEnv) in envs" :key="indexEnv">
            <template v-if="variable.type == utils.variable_types.string">
              <input type="text" v-model="variable.data[env.name]" />
            </template>
            <template v-else-if="variable.type == utils.variable_types.int">
              <input type="number" v-model="variable.data[env.name]" />
            </template>
            <template v-else-if="variable.type == utils.variable_types.float">
              <input
                type="number"
                step="0.01"
                v-model="variable.data[env.name]"
              />
            </template>
            <template v-else>
              <select v-model="variable.data[env.name]">
                <option :value="true">true</option>
                <option :value="false">false</option>
              </select>
            </template>
          </td>
        </tr>
      </table>
    </div>
    <div class="connections">
      <table>
        <caption>
          <div
            class="button mini green"
            @click="
              connections.push({
                name: 'new connection',
                type: utils.database_types.postgres,
                variable: '',
              })
            "
          >
            Добавить соединение с БД
          </div>
        </caption>
        <tr>
          <td>Название соединения</td>
          <td>Тип БД</td>
          <td>Строка соединения</td>
        </tr>
        <tr
          v-for="(connection, indexConnection) in connections"
          :key="indexConnection"
        >
          <td><input type="text" v-model="connection.name" /></td>
          <td>
            <select v-model="connection.type">
              <option
                v-for="type in utils.database_types"
                :key="type"
                :value="type"
              >
                {{ type }}
              </option>
            </select>
          </td>
          <td>
            <select v-model="connection.variable">
              <option
                v-for="(variable, indexVariable) in getVariablesByType(
                  utils.variable_types.string
                )"
                :key="indexVariable"
                :value="variable"
              >
                {{ variable.name }}
              </option>
            </select>
          </td>
        </tr>
      </table>
    </div>
    <div>
      <div
        class="button"
        @click="
          addStep(
            utils.step_type.sql,
            utils.sql_type.query,
            'step ' + (steps.length + 1)
          )
        "
      >
        add step
      </div>
      <div class="button" @click="compile">compile</div>
    </div>
    <div class="steps">
      <div
        class="step"
        v-for="(step, stepIndex) in steps"
        :key="stepIndex"
        :data-key="stepIndex"
      >
        <table>
          <caption>
            <div class="button red" @click="removeStep(step)">
              Удалить шаг {{ step.title }}
            </div>
          </caption>
          <tr>
            <td>Название шага</td>
            <td>
              <input type="text" v-model="step.title" />
            </td>
          </tr>
          <tr>
            <td>UUID</td>
            <td>{{ step.uuid }}</td>
          </tr>
          <tr></tr>
          <tr>
            <td>Количество потоков</td>
            <td><input type="number" v-model="step.thread_count" /></td>
          </tr>
          <tr>
            <td>Входящий канал</td>
            <td>
              <select v-model="step.inputstep">
                <option
                  v-for="(inputStep, indexOfInputStep) in getInput(step)"
                  :key="indexOfInputStep"
                  :value="inputStep"
                >
                  {{ inputStep.title }}
                </option>
              </select>
            </td>
          </tr>
          <tr v-if="step.inputstep.title && step.inputstep.title != ''">
            <td>Количетсво записей для срабатывания одной итерации</td>
            <td>
              <input type="number" v-model="step.record_count" />
            </td>
          </tr>
          <tr v-if="step.inputstep.title">
            <td>Условия по входящему каналу</td>
            <td>
              <table>
                <caption>
                  <div class="button mini green" @click="addCondition(step)">
                    Добавить условие
                  </div>
                </caption>
                <tr
                  v-for="(condition, conditionIndex) in step.input_conditions"
                  :key="conditionIndex"
                >
                  <td>
                    <select v-model="condition.input_variable">
                      <option
                        v-for="(variable, indexVariable) in step.inputstep
                          .output"
                        :key="indexVariable"
                        :value="variable"
                      >
                        {{ variable.name }}
                      </option>
                    </select>
                  </td>
                  <template v-if="condition.input_variable.type">
                    <td>
                      <select v-model="condition.condition">
                        <option
                          v-for="(
                            conditionType, conditionTypeIndex
                          ) in utils.condition_type"
                          :key="conditionTypeIndex"
                          :value="conditionType"
                        >
                          {{ conditionType.value }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <select v-model="condition.condition_source.type">
                        <option
                          v-for="source in utils.source"
                          :value="source"
                          :key="source"
                        >
                          {{ source }}
                        </option>
                      </select>
                    </td>
                    <td>
                      <template
                        v-if="
                          condition.condition_source.type == utils.source.text
                        "
                      >
                        <template
                          v-if="
                            condition.input_variable.type ==
                            utils.variable_types.bool
                          "
                        >
                          <select v-model="condition.condition_source.bool">
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        </template>
                        <template
                          v-else-if="
                            condition.input_variable.type ==
                            utils.variable_types.int
                          "
                        >
                          <input
                            type="number"
                            v-model="condition.condition_source.int"
                          />
                        </template>
                        <template
                          v-else-if="
                            condition.input_variable.type ==
                            utils.variable_types.float
                          "
                        >
                          <input
                            type="number"
                            v-model="condition.condition_source.float"
                            step="0.01"
                          />
                        </template>
                        <template v-else>
                          <input
                            type="text"
                            v-model="condition.condition_source.text"
                          />
                        </template>
                      </template>
                      <template v-else>
                        <select v-model="condition.input_variable.variable">
                          <option
                            v-for="(
                              variable, variableIndex
                            ) in getVariablesByType(
                              condition.input_variable.type
                            )"
                            :key="variableIndex"
                            :value="variable"
                          >
                            {{ variable.name }}
                          </option>
                        </select>
                      </template>
                    </td>
                  </template>
                  <td>
                    <div
                      class="button mini red"
                      @click="removeCondition(step, condition)"
                    >
                      Удалить
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr></tr>
          <tr>
            <td>Исходящие параметры</td>
            <td>
              <table>
                <caption>
                  <div class="button mini green" @click="addParam(step)">
                    Добавить исходящий параметр
                  </div>
                </caption>
                <tr
                  v-for="(param, indexParam) in step.output"
                  :key="indexParam"
                >
                  <td><input type="text" v-model="param.name" /></td>
                  <td>
                    <select v-model="param.type">
                      <option
                        v-for="(varType, indexVarType) in utils.variable_types"
                        :key="indexVarType"
                        :value="varType"
                      >
                        {{ varType }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <div
                      class="button mini red"
                      @click="step.output.splice(step.output.indexOf(param), 1)"
                    >
                      Удалить
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td></td>
            <td></td>
          </tr>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
//TODO добавление уровня логгера
//TODO автогенерация документации разобраться с documentation.html
//TODO сохранение с zip архив
//TODO добавление в ахрхив всех файлов для полноценной генерации
//TODO добавление .service
import utils from "./utils.js";
import compile from "./compile.js";
import steps from "./steps.js";
export default {
  name: "App",
  components: {},
  created() {},
  data: function () {
    return {
      connections: [],
      envs: [],
      steps,
      variables: [],
      utils,
    };
  },
  methods: {
    save(fileName) {
      let result = JSON.stringify(
        {
          variables: this.variables,
          connections: this.connections,
          steps: this.steps,
          envs: this.envs,
        },
        null,
        2
      );
      compile.download(fileName, result);
    },
    saveProject() {
      let fileName = prompt("Введите название файла.", "project");
      if (!fileName || fileName == "") return;
      if (fileName.indexOf(".json") == -1) {
        fileName += ".json";
      }
      this.save(fileName);
    },
    loadProject() {
      if (this.$refs.fileloader.files.length == 0) return;
      let reader = new FileReader();

      reader.onload = () => {
        console.log("чтение файла с конфигурацией произведено.");
        console.log(reader.result);
        const project = JSON.parse(reader.result);
        console.log(project);
        if (!project.envs) {
          alert("В проекте не хватает секции envs");
          return;
        }
        if (!project.steps) {
          alert("В проекте не хватает секции steps");
          return;
        }
        if (!project.variables) {
          alert("В проекте не хватает секции variables");
          return;
        }
        if (!project.connections) {
          alert("В проекте не хватает секции connections");
          return;
        }
        this.connections = project.connections;
        this.envs = project.envs;
        this.steps = project.steps;
        this.variables = project.variables;
      };

      reader.onerror = function () {
        alert(
          "чтение файла проекта закончилось с ошибкой, более детально в консоли."
        );
        console.log(reader.error);
      };
      reader.readAsText(this.$refs.fileloader.files[0]);
    },
    compile() {
      console.clear();
      const compiled = compile.steps(
        this.steps,
        this.connections,
        this.variables
      );
      let variableGO = compiled.steps;
      compile.download("variables.go",variableGO);
      compile.download("logic.go",compiled.logic);
      console.log(variableGO);
      console.log(compiled.logic);
    },
    console(data) {
      console.log(data);
    },
    getInput(step) {
      const channels = this.steps.slice(0, this.steps.indexOf(step));
      return channels;
    },
    addStep(maintype, type, title) {
      const step = {
        maintype,
        type,
        uuid: this.utils.StepUUID(),
        title: title,
        body: "",
        output: [],
        inputstep: {},
        input_conditions: [],
        input: [],
        thread_count: 1,
        record_count: 100,
      };
      this.steps.push(step);
      return step;
    },
    removeStep(step) {
      const keys = Object.keys(step);
      keys.forEach((key) => {
        delete step[key];
      });
      this.steps.splice(this.steps.indexOf(step), 1);
    },
    addParam(step) {
      const param = {
        name: "param" + (step.output.length + 1),
        type: this.utils.variable_types.string,
        uuid: this.utils.ParamUUID(),
      };
      step.output.push(param);
      return param;
    },
    compileCondition(condition_source) {
      condition_source.text = condition_source.text + "";
      condition_source.bool = Boolean(condition_source.bool);
      condition_source.int = parseInt(condition_source.int);
      condition_source.int = condition_source.int ? condition_source.int : 0;
      condition_source.float = parseFloat(condition_source.float);
      condition_source.float = condition_source.float
        ? condition_source.float
        : 0;
    },
    addCondition(step) {
      step.input_conditions.push({
        input_variable: {},
        condition: this.utils.condition_type[0],
        condition_source: {
          type: this.utils.source.variable,
          text: "",
          bool: false,
          int: 0,
          float: 0.0,
          variable: {},
        },
      });
    },
    removeCondition(step, condition) {
      step.input_conditions.splice(condition, 1);
    },
    addVariable(name, env, type, value) {
      switch (type) {
        case this.utils.variable_types.int:
          const valInt = parseInt(value);
          value = valInt ? valInt : 0;
          break;
        case this.utils.variable_types.float:
          const valFloat = parseFloat(value);
          value = valFloat ? valFloat : 0;
          break;
        case this.utils.variable_types.bool:
          value = Boolean(value);
          break;
        default:
          type = this.utils.variable_types.string;
          value = value + "";
      }
      let notChanged = true;
      this.variables.forEach((variable) => {
        if (variable.name && variable.name == name) {
          notChanged = false;
          variable.type = type;
          variable[env] = value;
        }
      });
      if (notChanged) {
        const variable = { name, type };
        variable[env] = value;
        this.variables.push(variable);
      }
    },
    getVariablesByType(type) {
      const result = [];
      this.variables.forEach((variable) => {
        if (variable.type == type) result.push(variable);
      });
      return result;
    },
  },
};
</script>

<style scoped>
.button {
  background-color: #4caf50; /* Green */
  border: none;
  color: white;
  padding: 15px 32px;
  text-align: center;
  text-decoration: none;
  display: inline-block;
  font-size: 16px;
  cursor: pointer;
  margin-right: 20px;
}
.button.mini {
  padding: 10px 20px;
  font-size: 12px;
}
.green {
  background-color: #4caf50;
} /* Green */
.blue {
  background-color: #008cba;
} /* Blue */
.red {
  background-color: #f44336;
} /* Red */
.gray {
  background-color: #e7e7e7;
  color: black;
} /* Gray */
.black {
  background-color: #555555;
} /* Black */
table {
  min-width: 100%;
  border: 1px solid #999;
}
table > tr > td:first-child {
  width: 200px;
}
</style>










































