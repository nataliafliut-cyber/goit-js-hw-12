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

// Пошук елементів DOM за правильним класом `.form`
const form = document.querySelector('.form');
const loadMoreBtn = document.querySelector('.load-more');

let searchQuery = '';
let page = 1;
const perPage = 15;

// Слухачі подій
form.addEventListener('submit', handleSearch);
loadMoreBtn.addEventListener('click', handleLoadMore);

/**
 * Обробник сабміту форми (Перша сторінка пошуку)
 */
async function handleSearch(event) {
  event.preventDefault();

  // Отримуємо значення з інпуту
  searchQuery = event.currentTarget.elements.searchQuery.value.trim();
  
  // Перевірка на порожній інпут
  if (!searchQuery) {
    iziToast.warning({
      message: 'Please enter a search query!',
      position: 'topRight',
    });
    return;
  }

  // Скидання параметрів перед новим пошуком
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

    // Рендеримо галерею
    createGallery(data.hits);

    // Перевірка на кінець колекції вже на першій сторінці (Зауваження ментора)
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
    form.reset(); // Очищаємо інпут форми після сабміту
  }
}

/**
 * Обробник кліку на кнопку "Load more" (Пагінація)
 */
async function handleLoadMore() {
  page += 1;
  hideLoadMoreButton(); // Ховаємо кнопку на час завантаження нових даних
  showLoader();

  try {
    const data = await getImagesByQuery(searchQuery, page);
    
    // Додаємо нові картки до вже існуючих
    createGallery(data.hits);

    // Плавний скрол сторінки вниз на дві висоти картки
    smoothScroll();

    // Вираховуємо максимальну кількість сторінок
    const totalPages = Math.ceil(data.totalHits / perPage);
    
    // Перевіряємо, чи дійшли ми до кінця колекції
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
 * Функція для плавного прокручування сторінки
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