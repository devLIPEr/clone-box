/* @refresh reload */
import { render } from 'solid-js/web';
import { Route, Router } from "@solidjs/router";

import './index.css';
import RoomLogin from './views/RoomLogin';
import FactOrFable from './views/FactOrFable';
import MinPlus from './views/MinPlus';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
    throw new Error(
        'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
    );
}

render(() => (
    <Router>
        <Route path="/" component={RoomLogin}/>
        <Route path="/minPlus" component={MinPlus}/>
        <Route path="/factOrFable" component={FactOrFable}/>
        <Route path="*paramName" component={RoomLogin}/>
    </Router>
), root!);