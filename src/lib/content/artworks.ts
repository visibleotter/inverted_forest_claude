import type { LocalizedString } from '../types';

/**
 * Captions for the artworks the site shows, keyed by image path.
 *
 * Each course is presented like an exhibit, and an exhibit has a label:
 * who made it, what it is, when, and where it hangs. All of these are in
 * the public domain; the files were taken from Wikimedia Commons and
 * cropped to 4:3 for the course frames. Source pages are noted beside
 * each entry so the attribution can be checked.
 *
 * An image without an entry here simply shows without a caption.
 */
export const artworks: Record<string, LocalizedString> = {
  // commons.wikimedia.org/wiki/File:Font-de-Gaume.jpg
  '/images/courses/prehistoric-mindset.jpg': {
    ru: 'Чарльз Р. Найт. Кроманьонские художники в пещере Фон-де-Гом. 1920. Американский музей естественной истории',
    en: 'Charles R. Knight. Cro-Magnon Artists Painting in Font-de-Gaume. 1920. American Museum of Natural History'
  },
  // commons.wikimedia.org/wiki/File:David_-_The_Death_of_Socrates.jpg
  '/images/courses/greek-philosophy.jpg': {
    ru: 'Жак-Луи Давид. Смерть Сократа. 1787. Метрополитен-музей, Нью-Йорк',
    en: 'Jacques-Louis David. The Death of Socrates. 1787. The Metropolitan Museum of Art, New York'
  },
  // commons.wikimedia.org/wiki/File:The_judgement_of_the_dead_in_the_presence_of_Osiris.jpg
  '/images/courses/ancient-mythology.jpg': {
    ru: 'Суд Осириса. Папирус Хунефера, «Книга мёртвых», фрагмент. Около 1275 г. до н. э. Британский музей',
    en: 'The Judgement of the Dead. Papyrus of Hunefer, Book of the Dead, detail. c. 1275 BC. British Museum'
  },
  // commons.wikimedia.org/wiki/File:Akropolis_by_Leo_von_Klenze.jpg
  '/images/courses/ancient-greece.jpg': {
    ru: 'Лео фон Кленце. Идеальный вид Акрополя и Ареопага в Афинах. 1846. Новая пинакотека, Мюнхен',
    en: 'Leo von Klenze. Ideal View of the Acropolis and Areopagus in Athens. 1846. Neue Pinakothek, Munich'
  },
  '/images/hero.webp': {
    ru: 'Клод Моне. Из серии «Утро на Сене». 1896–1897',
    en: 'Claude Monet. From the series Mornings on the Seine. 1896–1897'
  }
};
