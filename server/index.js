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

// Папка для хранения всех пользовательских папок
const usersFolderPath = path.join(__dirname, 'UsersFolder');

// Создаем папку UsersFolder, если она не существует
if (!fs.existsSync(usersFolderPath)) {
    fs.mkdirSync(usersFolderPath);
}

// Настройка хранилища для multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Получаем имя пользователя (папку)
        const userFolderName = req.body.folderName;  // Имя папки от пользователя
        if (!userFolderName) {
            return cb(new Error('Имя папки пользователя не указано'));
        }

        // Путь к папке пользователя в папке UsersFolder
        const userFolderPath = path.join(usersFolderPath, userFolderName);

        // Если папки нет, создаем её
        if (!fs.existsSync(userFolderPath)) {
            fs.mkdirSync(userFolderPath, { recursive: true });
        }

        // Указываем путь, куда сохранять файл
        cb(null, userFolderPath);
    },
    filename: function (req, file, cb) {
        // Сохраняем файл с оригинальным именем
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Маршрут для загрузки файлов
app.post('/upload', upload.array('files'), (req, res) => {
    const userFolderName = req.body.folderName;

    // Если файлы были загружены
    if (req.files) {
        res.send({
            message: `Файлы успешно загружены в папку пользователя: ${userFolderName}`,
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