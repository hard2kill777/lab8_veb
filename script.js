/* script.js - Финальная версия с динамической кнопкой оформления */

let dishes = [];

const selectedDishes = {
    soup: null,
    main: null,
    starter: null,
    drink: null,
    dessert: null
};

// ========== 1. РАБОТА С LOCALSTORAGE ==========

function saveSelectionToLocalStorage() {
    let ids = {};
    for (let cat in selectedDishes) {
        if (selectedDishes[cat]) {
            ids[cat] = selectedDishes[cat].keyword;
        }
    }
    localStorage.setItem('foodConstructOrder', JSON.stringify(ids));
}

function loadSelectionFromLocalStorage() {
    const stored = localStorage.getItem('foodConstructOrder');
    if (stored) {
        try {
            const ids = JSON.parse(stored);
            for (let cat in ids) {
                if (ids[cat]) {
                    let dish = dishes.find(d => d.keyword === ids[cat]);
                    if (dish) {
                        selectedDishes[cat] = dish;
                    }
                }
            }
        } catch (e) {
            console.warn("Ошибка чтения localStorage");
        }
    }
}

// ========== 2. ЗАГРУЗКА ДАННЫХ ==========

async function loadDishes() {
    if (typeof dishesBackup !== 'undefined' && dishesBackup.length > 0) {
        dishes = dishesBackup;
        console.log("Блюда загружены локально!");
        loadSelectionFromLocalStorage();
        renderMenu();
        updateOrderUI();
    } else {
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.innerHTML = `<div style="text-align: center; padding: 50px;">Ошибка: не найден файл data.js</div>`;
        }
        return;
    }

    const apiUrl = 'https://edu.std-900.ist.mospolytech.ru/labs/api/dishes';
    try {
        const response = await fetch(apiUrl);
        if (response.ok) {
            const data = await response.json();
            dishes = data;
            console.log("Данные обновлены с сервера!");
            loadSelectionFromLocalStorage();
            renderMenu();
            updateOrderUI();
        }
    } catch (error) {
        console.log("Используем локальные данные.");
    }
}

// ========== 3. ОТРИСОВКА ==========

function sortDishesByAlphabet(arr) {
    return arr.sort((a, b) => a.name.localeCompare(b.name));
}

function renderMenu() {
    const categories = ['soup', 'main', 'starter', 'drink', 'dessert'];

    categories.forEach(function(category) {
        let categoryDishes = dishes.filter(function(dish) {
            return dish.category === category;
        });
        
        categoryDishes = sortDishesByAlphabet(categoryDishes);
        const container = document.getElementById('menu-' + category);
        if (!container) return;

        let html = '';
        container.dataset.allDishes = JSON.stringify(categoryDishes);

        categoryDishes.forEach(function(dish) {
            html += `
                <div class="menu-card" data-dish="${dish.keyword}" data-kind="${dish.kind}">
                    <img src="${dish.image}" alt="${dish.name}">
                    <p class="price">${dish.price} руб.</p>
                    <p class="name">${dish.name}</p>
                    <p class="weight">${dish.count}</p>
                    <button class="add-btn">Добавить</button>
                </div>
            `;
        });

        container.innerHTML = html;
    });

    var buttons = document.querySelectorAll('.add-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', handleAddClick);
    });

    setupFilters();
}

// ========== 4. ФИЛЬТРЫ ==========

function setupFilters() {
    const categories = ['soup', 'main', 'starter', 'drink', 'dessert'];

    categories.forEach(function(category) {
        const filterContainer = document.getElementById('filters-' + category);
        if (!filterContainer) return;
        
        const buttons = filterContainer.querySelectorAll('.filter-btn');
        const menuContainer = document.getElementById('menu-' + category);

        buttons.forEach(function(btn) {
            btn.addEventListener('click', function() {
                const isActive = btn.classList.contains('active');
                buttons.forEach(function(b) { b.classList.remove('active'); });

                if (isActive) {
                    showAllDishes(menuContainer, category);
                } else {
                    btn.classList.add('active');
                    const kind = btn.dataset.kind;
                    filterDishesByKind(menuContainer, category, kind);
                }
            });
        });
    });
}

function filterDishesByKind(container, category, kind) {
    const allDishes = JSON.parse(container.dataset.allDishes);
    const filtered = allDishes.filter(function(dish) {
        return dish.kind === kind;
    });
    renderDishesInContainer(container, filtered);
}

function showAllDishes(container, category) {
    const allDishes = JSON.parse(container.dataset.allDishes);
    renderDishesInContainer(container, allDishes);
}

function renderDishesInContainer(container, dishesArray) {
    let html = '';
    dishesArray.forEach(function(dish) {
        html += `
            <div class="menu-card" data-dish="${dish.keyword}" data-kind="${dish.kind}">
                <img src="${dish.image}" alt="${dish.name}">
                <p class="price">${dish.price} руб.</p>
                <p class="name">${dish.name}</p>
                <p class="weight">${dish.count}</p>
                <button class="add-btn">Добавить</button>
            </div>
        `;
    });
    container.innerHTML = html;

    var buttons = container.querySelectorAll('.add-btn');
    buttons.forEach(function(btn) {
        btn.addEventListener('click', handleAddClick);
    });
    updateOrderUI();
}

// ========== 5. ДОБАВЛЕНИЕ В КОРЗИНУ И ОБНОВЛЕНИЕ UI ==========

function handleAddClick(event) {
    var card = event.target.closest('.menu-card');
    var dishKeyword = card.dataset.dish;

    var dish = dishes.find(function(d) {
        return d.keyword === dishKeyword;
    });
    
    if (!dish) return;

    selectedDishes[dish.category] = dish;
    
    saveSelectionToLocalStorage();
    updateOrderUI();
}

// ========== 6. ОБНОВЛЕНИЕ UI И СОЗДАНИЕ КНОПКИ ==========

function updateOrderUI() {
    var categories = ['soup', 'main', 'starter', 'drink', 'dessert'];
    var categoryTitles = {
        soup: 'Суп',
        main: 'Главное блюдо',
        starter: 'Салат/Стартер',
        drink: 'Напиток',
        dessert: 'Десерт'
    };
    
    var totalPrice = 0;
    var hasSelection = false;

    categories.forEach(function(category) {
        var container = document.getElementById('selected-' + category);
        if (!container) return;
        
        var title = container.querySelector('h4');
        var content = container.querySelector('.selected-content');
        
        var dish = selectedDishes[category];

        if (dish) {
            title.style.display = 'block';
            content.innerHTML = `
                <div class="selected-item">
                    <span>${dish.name}</span>
                    <span>${dish.price} руб.</span>
                </div>
            `;
            totalPrice += dish.price; 
            hasSelection = true;
        } else {
            title.style.display = 'none';
            content.innerHTML = '<p class="empty-msg">' + categoryTitles[category] + ' не выбран</p>';
        }
    });

    // ===== ДИНАМИЧЕСКОЕ СОЗДАНИЕ КНОПКИ ОФОРМЛЕНИЯ =====
    const panel = document.getElementById('dynamic-checkout-panel');
    
    if (hasSelection) {
        if (!panel) {
            // Если панели нет, создаем её
            const newPanel = document.createElement('div');
            newPanel.id = 'dynamic-checkout-panel';
            newPanel.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #ffffff;
                padding: 15px 30px;
                box-shadow: 0 -4px 15px rgba(0, 0, 0, 0.2);
                border-radius: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 20px;
                z-index: 1000;
                min-width: 300px;
                border: 1px solid #eee;
            `;
            
            newPanel.innerHTML = `
                <span style="font-weight: bold; font-size: 16px;">Стоимость: <span id="panel-total-price">0</span> руб.</span>
                <a href="order.html" id="dynamic-checkout-link" style="
                    padding: 10px 25px; 
                    background: tomato; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 10px; 
                    font-weight: bold; 
                    display: inline-block;
                    pointer-events: none; 
                    opacity: 0.5;
                    transition: 0.2s;
                ">Перейти к оформлению</a>
            `;
            
            document.body.appendChild(newPanel);
        }

        // Обновляем цену
        const totalSpan = document.getElementById('panel-total-price');
        if (totalSpan) totalSpan.textContent = totalPrice;

        // Проверка комбо
        var isSoup = selectedDishes.soup !== null;
        var isMain = selectedDishes.main !== null;
        var isStarter = selectedDishes.starter !== null;
        var isDrink = selectedDishes.drink !== null;

        let isValidCombo = false;
        if (isSoup && isMain && isStarter && isDrink) isValidCombo = true;
        else if (isSoup && isMain && isDrink && !isStarter) isValidCombo = true;
        else if (isSoup && isStarter && isDrink && !isMain) isValidCombo = true;
        else if (isMain && isStarter && isDrink && !isSoup) isValidCombo = true;
        else if (isMain && isDrink && !isSoup && !isStarter) isValidCombo = true;

        const link = document.getElementById('dynamic-checkout-link');
        if (link) {
            if (isValidCombo) {
                link.style.pointerEvents = 'auto';
                link.style.opacity = '1';
            } else {
                link.style.pointerEvents = 'none';
                link.style.opacity = '0.5';
            }
        }
    } else {
        // Если ничего не выбрано, удаляем панель
        if (panel) {
            panel.remove();
        }
    }

    // Подсветка карточек
    var allCards = document.querySelectorAll('.menu-card');
    allCards.forEach(function(card) {
        card.classList.remove('selected');
        var dishKeyword = card.dataset.dish;
        for (var cat in selectedDishes) {
            if (selectedDishes[cat] && selectedDishes[cat].keyword === dishKeyword) {
                card.classList.add('selected');
            }
        }
    });
}

// ========== ЗАПУСК ==========
document.addEventListener('DOMContentLoaded', function() {
    loadDishes();
});
