function UUID() {
    var result = new Date().getTime() + '' + Math.floor(Math.random() * 100000) + '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < 20; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function ChanUUID() {
    return "channel_" + UUID();
}
function StepUUID() {
    return "step_" + UUID();
}
function ParamUUID() {
    return "param_" + UUID();
}

function clearParam(param) {
    param.name = undefined;
    param.type = undefined;
}

const sql_type = {
    exec: "exec",
    query: "query",
}

const step_type = {
    sql: "sql",
}

const int = "int"
const float = "float"
const string = "string"
const bool = "bool"

const variable_types = {
    int,
    float,
    string,
    bool,
}

const database_types = {
    mssqldb: "mssqldb",
    mysql: "mysql",
    go_ibm_db: "go_ibm_db",
    postgres: "postgres",
    sqlite3: "sqlite3",
}

const equal = "==";
const unequal = "!=";
const greater = ">";
const greaterEqual = ">=";
const less = "<";
const lessEqual = "<=";

const condition_type = [
    { value: equal },
    { value: unequal },
    { value: greater },
    { value: greaterEqual },
    { value: less },
    { value: lessEqual },
];

const source = {
    variable: "переменная",
    text: "прямое значение"
}

function down(slice, element) {
    const index = slice.indexOf(element);
    // slice.splice(index, 1);
    // return [...slice.slice(0, index + 1), element, ...slice.slice(index + 1)];
    console.log([...slice.slice(0, index - 1), ...slice.slice(index + 1, 1), slice[index], ...slice.slice(index + 2)])
    [slice[index], slice[index + 1]] = [slice[index + 1], slice[index]];
    return slice;
}

function up(slice, element) {
    const index = slice.indexOf(element);
    if (index < 1) return;
    [slice[index], slice[index - 1]] = [slice[index - 1], slice[index]];
    return slice;
}

export default {
    sql_type,
    variable_types,
    step_type,
    database_types,
    condition_type,
    source,
    UUID,
    ChanUUID,
    StepUUID,
    ParamUUID,
    clearParam,
    down,
    up,
}