# Juego de Memoria - DOM y Eventos

Mini app en JavaScript vanilla para cumplir la consigna de construir, auditar y defender un Juego de Memoria. Se abre directamente con doble clic en `index.html`, sin frameworks ni paso de compilacion.

## Publicacion

Repositorio publico: reemplazar con el enlace del repositorio en GitHub.

Demo en GitHub Pages: reemplazar con `https://joamendozacuevas.github.io/juego-memoria/`.

## Archivos

- `index.html`: estructura principal del juego.
- `styles.css`: estilos visuales, tablero, cartas y estados.
- `app.js`: logica principal separada en estado, render y handlers.
- `parte2_codigo_para_auditar.html`: archivo solicitado, ahora separado y corregido.
- `parte2_corregido.html`: version de entrega para la Parte 2.
- `parte2_corregido.js`: correcciones comentadas con `// BUG:` y `// FIX:`.
- `proyecto_dom_eventos.html`: rubrica original de referencia.

## Requisitos funcionales solicitados

1. Tablero dinamico y barajado: `createDeck()`, `shuffle()` y `render()` crean las cartas desde `state.cards` al iniciar o reiniciar.
2. Voltear con click via delegacion: existe un solo listener en `#tablero`; `handleBoardClick()` detecta la carta usando `event.target.closest(".card")`.
3. Comparacion de dos cartas: `resolveTurn()` compara el `pairId` de ambas cartas en el estado.
4. Ocultar tras retardo: cuando no coinciden, `setTimeout()` espera 800 ms y vuelve a cerrar ambas cartas.
5. Bloqueo del tablero: `state.locked` impide voltear una tercera carta, repetir la misma carta o actuar durante la animacion.
6. Movimientos y cronometro: `state.moves`, `startTimer()` y `formatTime()` actualizan los marcadores.
7. Victoria: `checkVictory()` verifica si todas las cartas tienen `isFound === true`.
8. Reinicio: el boton Reiniciar llama a `resetGame()`, vuelve a barajar y limpia movimientos, tiempo y seleccion.
9. Eventos extra: `change` cambia la dificultad, `keydown` reinicia con la tecla R e `input` actualiza el nombre.
10. Retroalimentacion visual: las clases `is-open` e `is-found` muestran carta volteada y pareja encontrada; `#estado` comunica victoria o comparacion.
11. Bonus: dificultad variable y mejor puntaje guardado en `localStorage`.

## Auditoria de la Parte 2

La version inicial parecia funcionar si se jugaba lento, pero fallaba con interacciones rapidas. Se corrigieron estos puntos:

- Bug funcional: faltaba un bloqueo real del turno. Ahora `state.locked` evita clicks mientras se resuelve una pareja y tambien se ignoran cartas abiertas o encontradas.
- Seguridad: el nombre del jugador ya no se inserta con `innerHTML`. Se usa `textContent`, asi el texto del usuario no se interpreta como HTML.
- Arquitectura/rendimiento: la comparacion ya no lee `textContent` del DOM. La UI se dibuja desde `state` y la logica compara datos del estado.
- Rendimiento y mantenibilidad: se reemplazaron listeners por carta con delegacion de eventos en el tablero.
- Barajado: se reemplazo `sort(() => Math.random() - 0.5)` por Fisher-Yates.

## Decisiones de diseno

Use una fuente unica de verdad (`state`) porque el juego tiene reglas asincronas: si el DOM y el estado se contradicen, los bugs aparecen al hacer clicks rapidos. Por eso `render()` siempre pinta desde el estado y no al reves.

Use delegacion de eventos porque el tablero se destruye y se vuelve a crear en cada render. Un solo listener en el contenedor es mas simple, evita listeners duplicados y cumple la restriccion de la rubrica.

## Uso de IA

La IA ayudo a estructurar el codigo y detectar riesgos tipicos: doble click, tercera carta durante el `setTimeout`, uso inseguro de `innerHTML` y comparaciones basadas en el DOM. El codigo generado originalmente era fragil porque mezclaba estado con UI y no bloqueaba el tablero; esas partes se corrigieron con estado explicito y funciones separadas.

## Mejora futura

Con mas tiempo agregaria una animacion de volteo mas elaborada y una tabla de mejores puntajes por jugador, manteniendo los datos validados antes de guardarlos.


