/* order.js - Локальная эмуляция работы с сервером */

// Загружаем локальный файл как "базу данных" (вместо API)
async function loadDishesFromAPI() {
    if (typeof dishesBackup !== 'undefined') {
        return dishesBackup; 
    }
    return [];
}

// Получаем заказ из localStorage
function getOrderFromStorage() {
    const stored = localStorage.getItem('foodConstructOrder');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) { return {}; }
    }
    return {};
}

// Главная функция загрузки страницы
async function initOrderPage() {
    const allDishes = await loadDishesFromAPI();
    const storedIds = getOrderFromStorage();
    const container = document.getElementById('order-contents');

    if (Object.keys(storedIds).length === 0) {
        container.innerHTML = `<div style="padding:20px; text-align:center;">Ничего не выбрано. <a href="menu.html" style="color:tomato;">Собрать ланч</a>.</div>`;
        document.querySelector('.order-section').style.display = 'none';
        return;
    }

    let orderHtml = '<div class="menu-grid">';
    let foundDishes = [];
    
    for (let cat in storedIds) {
        let keyword = storedIds[cat];
        let dish = allDishes.find(d => d.keyword === keyword);
        if (dish) {
            foundDishes.push(dish);
            orderHtml += `
                <div class="menu-card" data-keyword="${dish.keyword}">
                    <img src="${dish.image}" alt="${dish.name}">
                    <p class="price">${dish.price} руб.</p>
                    <p class="name">${dish.name}</p>
                    <p class="weight">${dish.count}</p>
                    <button class="remove-btn" data-keyword="${dish.keyword}" style="background: tomato; color: #fff;">Удалить</button>
                </div>
            `;
        }
    }
    orderHtml += '</div>';
    container.innerHTML = orderHtml;

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const kw = this.dataset.keyword;
            for (let cat in storedIds) {
                if (storedIds[cat] === kw) {
                    delete storedIds[cat];
                    break;
                }
            }
            localStorage.setItem('foodConstructOrder', JSON.stringify(storedIds));
            initOrderPage();
        });
    });

    populateOrderDetails(storedIds, allDishes);
}

// Заполняем левую часть формы (детали заказа + цена)
function populateOrderDetails(storedIds, allDishes) {
    let total = 0;
    const categories = ['soup', 'main', 'starter', 'drink', 'dessert'];
    const titles = {
        soup: 'Суп', main: 'Главное блюдо', starter: 'Салат/Стартер',
        drink: 'Напиток', dessert: 'Десерт'
    };

    categories.forEach(cat => {
        const container = document.getElementById('selected-' + cat);
        if (!container) return;
        const title = container.querySelector('h4');
        const content = container.querySelector('.selected-content');
        const kw = storedIds[cat];

        if (kw) {
            let dish = allDishes.find(d => d.keyword === kw);
            if (dish) {
                title.style.display = 'block';
                content.innerHTML = `<div class="selected-item"><span>${dish.name}</span><span>${dish.price} руб.</span></div>`;
                total += dish.price;
            }
        } else {
            title.style.display = 'none';
            content.innerHTML = `<p class="empty-msg">${titles[cat]} не выбран</p>`;
        }
    });

    document.getElementById('total-price').textContent = total;
}

// =========================================================================
// САМАЯ ВАЖНАЯ ЧАСТЬ: ЭМУЛЯЦИЯ ОТПРАВКИ
// =========================================================================
document.getElementById('submitOrderForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    // 1. Проверяем комбо
    const storedIds = getOrderFromStorage();
    
    // Простая проверка комбо (есть ли суп/главное/напиток)
    const isSoup = !!storedIds.soup;
    const isMain = !!storedIds.main;
    const isDrink = !!storedIds.drink;
    const isStarter = !!storedIds.starter;

    let isValidCombo = false;
    if (isSoup && isMain && isStarter && isDrink) isValidCombo = true;
    else if (isSoup && isMain && isDrink && !isStarter) isValidCombo = true;
    else if (isSoup && isStarter && isDrink && !isMain) isValidCombo = true;
    else if (isMain && isStarter && isDrink && !isSoup) isValidCombo = true;
    else if (isMain && isDrink && !isSoup && !isStarter) isValidCombo = true;

    if (!isValidCombo) {
        alert('Состав заказа не соответствует ни одному доступному комбо!');
        return;
    }

    // 2. Собираем данные из формы (обязательные поля)
    const formData = new FormData(this);
    const data = {};
    formData.forEach((value, key) => { data[key] = value; });
    
    // Добавляем ID блюд (для сервера)
    data.soup_id = storedIds.soup || null;
    data.main_course_id = storedIds.main || null;
    data.salad_id = storedIds.starter || null;
    data.drink_id = storedIds.drink || null;
    data.dessert_id = storedIds.dessert || null;

    // Обработка времени
    if (data.delivery_type === 'now') data.delivery_time = null;
    if (!data.subscribe) data.subscribe = 0;

    // 3. ИМИТАЦИЯ ОТПРАВКИ НА СЕРВЕР (Эмуляция fetch)
    console.log("Эмуляция отправки данных на сервер:", data);

    // Имитируем задержку сети в 1 секунду
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Если бы это был реальный сервер Политеха, выглядело бы так:
    /*
    const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/orders?api_key=ваш_ключ', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    */

    // 4. Обработка "ответа сервера"
    // Имитируем успешный ответ (200 OK)
    if (true) { 
        // Очищаем localStorage, так как заказ "оформлен"
        localStorage.removeItem('foodConstructOrder');
        alert('✅ Заказ успешно оформлен! (Эмуляция)');
        window.location.href = 'menu.html';
    } else {
        // Имитируем ошибку
        alert('Ошибка при оформлении заказа: Сервер временно недоступен.');
    }
});

// Запуск
document.addEventListener('DOMContentLoaded', initOrderPage);
