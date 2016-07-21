## Домашнее задание к лекции "Мультимедиа возможности браузера"

Видеоплеер в духе немого кино — «Киноглушитель».

#### Основные техники, которые должны быть реализованы:
- Постобработка видео (реализованная с помощью canvas):
  - Показ ч/б видео
  - Эффект царапин на плёнке
- Сопровождение ролика музыкой тапёра
- Показ субтитров в духе немого кино: после конца реплики надо приостанавливать воспроизведение видео, отображать субтитры на черном фоне в течение длины реплики, после продолжать воспроизведение видео

#### Также приветствуется реализация дополнительных техник на более высокую оценку:
- Оптимизация постобработки видео: размер canvas'а, шейдеры, оптимизированная математика
- Эффект старой записи для звука
- Эффект зернистости плёнки

#### Что сделано
- [x] Честная постобработка
- [x] Чб
- [x] Эффект пленки
- [x] Музыка с эффектом старой записи (шумы, проседание громкости)
- [x] Субтитры духе немого кино (после фразы, черный фон, рамка, шрифт)
- [x] Оптимизации (чб в один прогон, а не по пикселям, отсутствие сложной математики)
- [x] Удобство работы с АПИ плеера
- [x] Слоенная система постобработки видео
- [x] Использование рабочего канваса (виртуальный канвас на котором происходит весь просчет кадра, затем за один прогон переносится на настоящий канвас)
- [x] Показ прогресса видео

#### Реализовал и выпилил
- [ ] Уменьшение размера рабочего канваса
- [ ] Синтетический постпроцессинг

#### Что хотел, пытался, но не сделал
- [ ] WebGL

#### Что хотел, но не дошли руки
- [ ] Отнаследоваться от HTMLMediaElement и реализовать его методы в рамках HTMLCustomVideoElement
- [ ] Красивый интерфейс

#### Файлы:
- [видеофайл](http://www.kinopoisk.ru/getlink.php?id=284167&type=trailer&link=https://kp.cdn.yandex.net/502838/kinopoisk.ru-Sherlock-284167.mp4) трейлера (но можно и любой другой)
- текстовый [файл](https://github.com/shri-msk-2016/dz-multimedia/blob/master/subs.srt) субтитров
- аудиофайл с музыкой тапёра: [Maple Leaf Rag](https://upload.wikimedia.org/wikipedia/commons/a/a6/Maple_Leaf_RagQ.ogg),
[The Entertainer](https://upload.wikimedia.org/wikipedia/commons/2/2c/The_Entertainer_-_1902_-_By_Scott_Joplin.ogg) (ну или возьмите свой любимый регтайм :-)
- в качестве шрифта можно использовать [Oranienbaum](https://www.google.com/fonts/specimen/Oranienbaum)

#### Ссылки для изучения

- https://developer.apple.com/library/safari/documentation/AudioVideo/Conceptual/HTML-canvas-guide/Introduction/Introduction.html
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
- https://ffmpeg.org/
- http://plutov.by/post/html5_ffmpeg
- http://www.johndcook.com/blog/2009/08/24/algorithms-convert-color-grayscale/

#### Ссылки для вдохновения

- [Alice in Wonderland (1915)](https://www.youtube.com/watch?v=-E-kc4Wvsaw)
- [The Phantom of the Opera (1925)](https://www.youtube.com/watch?v=aI0tWZc8gP4)
- [The Champion - 1915](https://www.youtube.com/watch?v=yEYQiO34lyk)

## Куда и когда присылать
- Работы присылать на maxatwork@yandex-team.ru
- Желательно ссылками на сверстанную страницу (например, разместить на бесплатном [GitHub Pages](https://pages.github.com/) с помощью gh-pages)
- Тема: "ДЗ по Multimediа (фамилия и имя)"
- Срок — до 21 июля, 12:00
