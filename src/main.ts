import { createApp } from "vue";
import "@/style/index.css";
import App from "@/presentation/App.vue";
import { router } from "@/router";

const app = createApp(App);
app.use(router);
app.mount("#root");
