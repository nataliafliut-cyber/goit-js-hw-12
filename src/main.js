import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';

import { getImagesByQuery } from './js/pixabay-api.js';
import {
  createGallery,
  clearGallery,
  showLoader,
  hideLoader,
  showLoadMoreButton,
  hideLoadMoreButton,
} from './js/render-functions.js';

// Елементи DOM
const form = document.querySelector('.form');
const loadMoreBtn = document.querySelector('.load-more');

let searchQuery = '';
let page = 1;
const perPage = 15;

// Слухачі подій
form.addEventListener('submit', handleSearch);
loadMoreBtn.addEventListener('click', handleLoadMore);

/**
 * Обробник події сабміту форми (Перший пошук)
 */
async function handleSearch(event) {
  event.preventDefault();

  searchQuery = event.currentTarget.elements.searchQuery.value.trim();
  
  // Перевірка на порожній інпут
  if (!searchQuery) {
    iziToast.warning({
      message: 'Please enter a search query!',
      position: 'topRight',
    });
    return;
  }

  // Скидання параметрів
  page = 1;
  clearGallery();
  hideLoadMoreButton();
  showLoader();

  try {
    const data = await getImagesByQuery(searchQuery, page);

    // Якщо нічого не знайдено
    if (data.hits.length === 0) {
      iziToast.error({
        message: 'Sorry, there are no images matching your search query. Please try again!',
        position: 'topRight',
      });
      return;
    }

    // Рендер карток
    createGallery(data.hits);

    // ВИПРАВЛЕННЯ ДЛЯ МЕНТОРА: Перевірка на малу кількість результатів (кінець колекції на 1-й сторінці)
    if (data.totalHits <= perPage) {
      iziToast.info({
        message: "We're sorry, but you've reached the end of search results.",
        position: 'topRight',
      });
    } else {
      showLoadMoreButton();
    }
  } catch (error) {
    iziToast.error({
      message: `Something went wrong: ${error.message}`,
      position: 'topRight',
    });
  } finally {
    hideLoader();
    form.reset(); // Очищення форми
  }
}

/**
 * Обробник події для кнопки "Load more" (Пагінація)
 */
async function handleLoadMore() {
  page += 1;
  hideLoadMoreButton(); // Ховаємо кнопку на час запиту
  showLoader();

  try {
    const data = await getImagesByQuery(searchQuery, page);
    
    // Додаємо нові елементи до вже існуючих
    createGallery(data.hits);

    // Плавний скрол
    smoothScroll();

    // Вираховуємо максимальну кількість сторінок
    const totalPages = Math.ceil(data.totalHits / perPage);
    
    // Перевірка на кінець колекції для наступних сторінок
    if (page >= totalPages) {
      iziToast.info({
        message: "We're sorry, but you've reached the end of search results.",
        position: 'topRight',
      });
    } else {
      showLoadMoreButton();
    }
  } catch (error) {
    iziToast.error({
      message: `Something went wrong: ${error.message}`,
      position: 'topRight',
    });
  } finally {
    hideLoader();
  }
}

/**
 * Функція плавного прокручування
 */
function smoothScroll() {
  const galleryItem = document.querySelector('.gallery-item');
  if (galleryItem) {
    const { height: cardHeight } = galleryItem.getBoundingClientRect();
    window.scrollBy({
      top: cardHeight * 2,
      behavior: 'smooth',
    });
  }
}