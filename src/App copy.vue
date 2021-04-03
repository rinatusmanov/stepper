<template>
  <div id="app">
    <header>
      <div class="button" @click="newsqlbefore">add sql before</div>
      <div class="button" @click="newrequest">add request</div>
      <div class="button" @click="newsqlafter">add sql after</div>
    </header>
    <div class="steps">
      <div class="sql" v-for="(sql, index) in sqlBefore" :key="index">
        <div class="title-edit"><input type="text" v-model="sql.title" /></div>
        <div class="input-channels">
          <div class="input-channels-select">
            <select v-model="sql.input_channels" multiple>
              <template v-for="(ch, indexCh) in otherChannels(sql)">
                <template v-if="channelDisabled(ch.link, sql)">
                  <option
                    class="channel-list"
                    :key="indexCh"
                    :value="ch"
                    disabled="disabled"
                  >
                    {{ ch.link.title }} Шаг зависит от данного канала
                  </option>
                </template>
                <template v-else>
                  <option class="channel-list" :key="indexCh" :value="ch">
                    {{ ch.link.title }}
                  </option>
                </template>
              </template>
            </select>
          </div>
          <div class="input-channels-variables">
            input-channels-variables
            <template v-for="(ch, indexCh) in sql.input_channels">
              <div :key="indexCh">
                <div
                  v-for="(value, keyOfparametr) in ch.link.parameters"
                  :key="keyOfparametr"
                >
                  {{ ch.link.title }}.{{ keyOfparametr }}.{{ value }}
                </div>
              </div>
            </template>
          </div>
          <div v-if="sql.type == sql_type.query">
            Переменные для сканирования результата.
            <div v-for="(variable, indexVariable) in sql.scanVariables" :key="indexVariable">
              <input type="text" v-model="variable.name">
              <select v-model="variable.type">
                <option v-for="(type,typeIndex) in variable_types" :key="typeIndex" :value="type">{{type}}</option>
              </select>
            </div>
            <div>
              <div
                @click="
                  sql.scanVariables.push({
                    name: 'new',
                    type: variable_types.string,
                  })
                "
                class="button"
              >
                Добавить переменную для сканирования результата
              </div>
            </div>
          </div>
        </div>
        <div>{{ sql }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import utils from "./utils.js";
export default {
  name: "App",
  components: {},
  mounted() {},
  data: function () {
    return {
      channels: [
        {
          name: "begin",
          link: {
            parameters: { done: utils.variable_types.bool },
            title: "инициализация",
          },
        },
      ],
      sql_type: utils.sql_type,
      variable_types: utils.variable_types,
      sqlBefore: [],
      sqlRequest: [],
      sqlAfter: [],
    };
  },
  methods: {
    channelDisabled(step, checkStep) {
      if (!step.input_channels || step.input_channels.length == 0) return false;
      for (let index = 0; index < step.input_channels.length; index++) {
        const element = step.input_channels[index].link;
        if (checkStep == element) return true;
        if (this.channelDisabled(element, checkStep)) return true;
      }
      return false;
    },
    otherChannels(step) {
      let channelList = [step.title];
      step.input_channels.forEach((ch) => {
        channelList.push(ch.title);
      });
      let result = [];

      this.channels.forEach((ch) => {
        if (ch.link == step) return;
        result.push(ch);
      });
      return result;
    },
    newsqlbefore() {
      this.sqlBefore.push(this.sql("sql запрос"));
    },
    newrequest() {},
    newsqlafter() {
      this.sqlAfter.push(this.sql("sql запрос"));
    },
    sql() {
      let link = {
        step: "sql",
        arguments: [],
        input_channels: [],
        parameters: {},
        scanVariables: [],
        title: "Запрос",
        type: utils.sql_type.query,
      };
      let ch = {
        name: utils.UUID(),
        link,
      };
      this.channels.push(ch);
      return link;
    },
  },
};
</script>

<style scoped>
#app {
  position: fixed;
  padding: 20px 0px;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  overflow: auto;
}
header {
  height: 60px;
  border-bottom: 1px solid teal;
  padding: 0px 20px;
}
.button {
  display: inline-block;
  padding: 15px;
  background: teal;
  color: white;
  margin-right: 15px;
  cursor: pointer;
}
.steps {
  padding: 15px;
  padding-bottom: 30px;;
}
</style>

