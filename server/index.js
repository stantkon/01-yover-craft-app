const multer = require('multer');
const fs = require('fs');
const path = require('path');
const express = require('express');
const config = require('config');
const cors = require('cors'); // Подключаем CORS

const app = express();
const PORT = 5000;

// Настройка CORS для разрешения запросов с других доменов
app.use(cors());

// Настройка парсинга JSON и данных формы
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const folderName = req.body.folderName || 'default_folder';
        const folderPath = path.join(__dirname, folderName);

        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        cb(null, folderPath);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Маршрут для загрузки файлов
app.post('/upload', upload.array('files'), (req, res) => {
    const folderName = req.body.folderName || 'default_folder';

    if (req.files) {
        res.send({
            message: `Файлы успешно загружены в папку: ${folderName}`,
            files: req.files
        });
    } else {
        res.status(400).send({ message: 'Нет файлов для загрузки' });
    }
});

// Запуск сервера
const start = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
    }
}

start();