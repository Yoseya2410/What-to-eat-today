const STORAGE_VERSION = '1.0';
let menu = [];
let filteredMenu = [];

// 时间判断函数
function getCurrentTimePeriod() {
    const hours = new Date().getHours();
    if (hours >= 5 && hours < 9) return 'a';
    if (hours >= 9 && hours < 17) return 'b';
    if (hours >= 17 && hours < 24) return 'c';
    return '';
}

// 价格格式化
function formatPrice(price) {
    return price % 1 === 0
        ? price.toFixed(0)
        : price.toFixed(1);
}
function formatPrice(price) {
    return price % 1 === 0
        ? price.toFixed(0)
        : price.toFixed(1);
}

// 文件处理功能
function handleCSVUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        parseCSVData(e.target.result);
        showUploadSuccess();
    };

    reader.readAsText(file);
}

// 数据解析与存储
function parseCSVData(csvText) {
    const rows = csvText.split('\n').slice(1);
    const newMenu = rows.filter(row => row.trim()).map(row => {
        const [name, price, canteen, floor, window, time] = row.split(',');
        return {
            name: name?.trim() || '未知菜品',
            price: parseFloat(price?.trim()) || 0,
            canteen: canteen?.trim() || '未知食堂',
            floor: floor?.trim() || '',
            window: window?.trim() || '',
            time: time?.trim() || 'bc'
        };
    });

    localStorage.setItem('menuData', JSON.stringify({
        version: STORAGE_VERSION,
        data: newMenu
    }));

    menu = newMenu;
    filteredMenu = [...newMenu];
    applyFilter();
    searchDishes();
}

// 初始化加载菜单
async function loadMenu() {
    try {
        const savedData = localStorage.getItem('menuData');
        if (savedData) {
            const { version, data } = JSON.parse(savedData);
            if (version === STORAGE_VERSION) {
                menu = data;
                filteredMenu = [...data];
                return true;
            }
        }

        const response = await fetch('menu.csv');
        const data = await response.text();
        parseCSVData(data);
        return true;
    } catch (error) {
        console.error('菜单加载失败:', error);
        document.getElementById("dishName").textContent = "菜单加载失败";
        return false;
    }
}

// 主初始化函数
async function initializeApp() {
    // 设置初始时间段
    document.getElementById("modalTime").value = getCurrentTimePeriod();

    // 加载菜单数据
    const loadSuccess = await loadMenu();

    // 数据加载成功后应用筛选
    if (loadSuccess) {
        applyFilter();
    }
}

// 数据恢复功能
function resetToDefaultData() {
    localStorage.removeItem('menuData');
    showUploadSuccess('已恢复默认菜单');
    setTimeout(() => location.reload(), 1000);
}

// 增强版提示功能
function showUploadSuccess(message = '菜单数据已更新！') {
    const alertDiv = document.createElement('div');
    alertDiv.className = 'upload-alert';
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 2000);
}

// 筛选功能
function applyFilter() {
    const maxPrice = document.getElementById("modalMaxPrice").value;
    const canteen = document.getElementById("modalCanteen").value;
    const time = document.getElementById("modalTime").value;

    filteredMenu = menu.filter(dish => {
        const priceCondition = maxPrice ? dish.price <= parseFloat(maxPrice) : true;
        const canteenCondition = canteen ? dish.canteen === canteen : true;
        const timeCondition = time ? dish.time.includes(time) : true;
        return priceCondition && canteenCondition && timeCondition;
    });

    document.getElementById("dishName").textContent = filteredMenu.length
        ? "今天吃什么？"
        : "没有符合的菜品";
    document.getElementById("price").textContent = "";
    document.getElementById("location").textContent = "";
    searchDishes();
}

// 随机选菜功能
function chooseDish() {
    if (filteredMenu.length === 0) {
        document.getElementById("dishName").textContent = "没有符合的菜品";
        return;
    }
    const randomIndex = Math.floor(Math.random() * filteredMenu.length);
    const dish = filteredMenu[randomIndex];
    document.getElementById("dishName").textContent = dish.name;
    document.getElementById("price").textContent = `${formatPrice(dish.price)}元`;
    document.getElementById("location").textContent = `${dish.canteen} ${dish.floor} ${dish.window ? dish.window + '号窗口' : ''}`;
}

// 弹窗控制功能
function openFilterModal() {
    document.getElementById("filterOverlay").style.display = "block";
    document.getElementById("filterModal").style.display = "block";
}

function closeFilterModal() {
    document.getElementById("filterOverlay").style.display = "none";
    document.getElementById("filterModal").style.display = "none";
}

function applyFilterFromModal() {
    applyFilter();
    closeFilterModal();
}

// 搜索功能
function searchDishes() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase().trim();
    const searchResults = document.getElementById("searchResults");

    searchResults.innerHTML = "";
    if (!searchTerm) return;

    const results = filteredMenu.filter(dish =>
        dish.name.toLowerCase().includes(searchTerm)
    );

    if (results.length === 0) {
        searchResults.innerHTML = "<p class='no-results'>未找到相关菜品</p>";
    } else {
        searchResults.innerHTML = results.map(dish => `
            <div class="search-result-item">
                <h3>${dish.name}</h3>
                <p>价格：${formatPrice(dish.price)}元</p>
                <p>${dish.canteen} ${dish.floor} ${dish.window ? dish.window + '号窗口' : ''}</p>
            </div>
        `).join("");
    }
}

// 下拉菜单功能
function openDropdownModal() {
    document.getElementById("dropdownOverlay").style.display = "block";
    document.getElementById("dropdownModal").style.display = "block";
}

function closeDropdownModal() {
    document.getElementById("dropdownOverlay").style.display = "none";
    document.getElementById("dropdownModal").style.display = "none";
}

// 初始化事件
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("searchInput").addEventListener("input", searchDishes);
    document.getElementById('csvInput').addEventListener("change", handleCSVUpload);
    initializeApp();
});

function openDobao() {
    window.open("https://doubao.com/bot/egx8QZwB");
}

/*pwa*/
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('Service Worker 注册成功:', registration.scope);

                // 监听 updatefound 事件
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    installingWorker.onstatechange = () => {
                        if (installingWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {

                                if (registration.waiting) {
                                    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

                                    // 监听 controllerchange 事件
                                    navigator.serviceWorker.addEventListener('controllerchange', () => {
                                        window.location.reload();
                                    });
                                }

                            } else {
                                // 第一次安装
                            }
                        }
                    };
                };

                // 接收来自Service Worker的消息
                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data.type === 'UPDATE_AVAILABLE') {

                        if (registration.waiting) {
                            registration.waiting.postMessage({ type: 'SKIP_WAITING' });

                            // 监听 controllerchange 事件
                            navigator.serviceWorker.addEventListener('controllerchange', () => {
                                window.location.reload();
                            });
                        }
                    }
                });
            })
            .catch(error => {
                console.error('Service Worker 注册失败:', error);
            });
    });
}