import { writable } from 'svelte/store';
import type MiraiBot from './main';

const plugin = writable<MiraiBot>();
export default { plugin };
