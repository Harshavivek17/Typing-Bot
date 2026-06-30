import '$/styles/index.css';
import { App } from '$/views/app';
import Alpine from 'alpinejs';

await import("$/views/counter/script").then((m) =>
  Alpine.data("counter", m.default)
);

window.Alpine = Alpine;

Alpine.start();

document.querySelector<HTMLDivElement>("#app")!.innerHTML = String(<App />);
