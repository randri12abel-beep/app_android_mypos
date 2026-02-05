import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import 'primeicons/primeicons.css'
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Aura from '@primevue/themes/aura';
import TreeTable from 'primevue/treetable';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import Row from 'primevue/row';
import Button from 'primevue/button';


const app = createApp(App)

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            prefix: 'p',
            darkModeSelector: '.my-app-dark',
            cssLayer: false
        }
    },
    ripple: true
});
app.use(ToastService);
app.component('TreeTable', TreeTable)
app.component('Column', Column)
app.component('ColumnGroup', ColumnGroup)
app.component('Row', Row)
app.component('Button', Button)

app.mount('#app')
