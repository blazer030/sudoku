import { createApp } from "vue";
import { createPinia } from "pinia";
import "@/style/index.css";
import App from "@/presentation/App.vue";
import { router } from "@/router";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount("#root");
