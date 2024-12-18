const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 5000;

// Настроим CORS
app.use(cors());
app.use(express.json());

// Папка для хранения пользователей
const usersFolderPath = path.join(__dirname, 'UsersFolder');
if (!fs.existsSync(usersFolderPath)) {
    fs.mkdirSync(usersFolderPath);
}

// Сохранение пользователей в файле
const usersFilePath = path.join(__dirname, 'users.json');

// Получение списка пользователей
const getUsers = () => {
    if (fs.existsSync(usersFilePath)) {
        const data = fs.readFileSync(usersFilePath);
        return JSON.parse(data);
    }
    return [];
};

// Сохранение пользователей в файл
const saveUsers = (users) => {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

// Регистрация нового пользователя
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    const users = getUsers();

    // Проверим, существует ли уже такой пользователь
    const userExists = users.find(user => user.username === username);
    if (userExists) {
        return res.status(400).send({ message: 'Пользователь уже существует' });
    }

    // Хешируем пароль
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Добавляем нового пользователя
    users.push({ username, password: hashedPassword });
    saveUsers(users);

    // Создаем папку для пользователя
    const userFolderPath = path.join(usersFolderPath, username);
    if (!fs.existsSync(userFolderPath)) {
        fs.mkdirSync(userFolderPath);
    }

    res.send({ message: 'Пользователь зарегистрирован' });
});

// Вход пользователя
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const users = getUsers();

    const user = users.find(user => user.username === username);

    if (!user) {
        return res.status(400).send({ message: 'Пользователь не найден' });
    }

    // Проверка пароля
    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
        return res.status(400).send({ message: 'Неверный пароль' });
    }

    res.send({ message: 'Вход выполнен успешно' });
});

// Получение списка файлов и папок в папке пользователя
app.get('/files', (req, res) => {
    const { username, currentFolder } = req.query;
    const userFolderPath = path.join(usersFolderPath, username);

    if (!fs.existsSync(userFolderPath)) {
        return res.status(400).send({ message: 'Папка пользователя не найдена' });
    }

    let directoryPath = userFolderPath;
    if (currentFolder) {
        directoryPath = path.join(directoryPath, currentFolder);
    }

    // Проверка, существует ли папка
    if (!fs.existsSync(directoryPath)) {
        return res.status(400).send({ message: 'Папка не найдена' });
    }

    const files = fs.readdirSync(directoryPath);

    // Разделяем папки и файлы
    const folders = files.filter(file => fs.lstatSync(path.join(directoryPath, file)).isDirectory());
    const filesOnly = files.filter(file => fs.lstatSync(path.join(directoryPath, file)).isFile());

    res.send({
        folders: folders,
        files: filesOnly,
    });
});

// Настройка загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { username, currentFolder } = req.query;
        const userFolderPath = path.join(usersFolderPath, username);
        let folderPath = userFolderPath;
        if (currentFolder) {
            folderPath = path.join(folderPath, currentFolder);
        }

        if (!fs.existsSync(folderPath)) {
            return cb(new Error('Папка пользователя не найдена'));
        }

        cb(null, folderPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Загрузка файлов
app.post('/upload', upload.array('files'), (req, res) => {
    res.send({ message: 'Файлы успешно загружены' });
});

// Создание новой папки
app.post('/createFolder', (req, res) => {
    const { username, folderName, parentFolder } = req.body;
    const userFolderPath = path.join(usersFolderPath, username);
    let folderPath = userFolderPath;
    if (parentFolder) {
        folderPath = path.join(folderPath, parentFolder);
    }

    const newFolderPath = path.join(folderPath, folderName);

    if (fs.existsSync(newFolderPath)) {
        return res.status(400).send({ message: 'Папка с таким именем уже существует' });
    }

    fs.mkdirSync(newFolderPath);
    res.send({ message: 'Папка успешно создана' });
});

// Удаление файла
app.delete('/deleteFile', (req, res) => {
    const { username, fileName, currentFolder } = req.body;
    const userFolderPath = path.join(usersFolderPath, username);
    let folderPath = userFolderPath;
    if (currentFolder) {
        folderPath = path.join(folderPath, currentFolder);
    }

    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(400).send({ message: 'Файл не найден' });
    }

    fs.unlinkSync(filePath);
    res.send({ message: 'Файл успешно удален' });
});

// Удаление папки
app.delete('/deleteFolder', (req, res) => {
    const { username, folderName, currentFolder } = req.body;
    const userFolderPath = path.join(usersFolderPath, username);
    let folderPath = userFolderPath;
    if (currentFolder) {
        folderPath = path.join(folderPath, currentFolder);
    }

    const folderPathToDelete = path.join(folderPath, folderName);

    if (!fs.existsSync(folderPathToDelete)) {
        return res.status(400).send({ message: 'Папка не найдена' });
    }

    fs.rmdirSync(folderPathToDelete, { recursive: true });
    res.send({ message: 'Папка успешно удалена' });
});

// Скачивание файла
app.get('/download', (req, res) => {
    const { username, fileName, currentFolder } = req.query;
    const userFolderPath = path.join(usersFolderPath, username);
    let folderPath = userFolderPath;
    if (currentFolder) {
        folderPath = path.join(folderPath, currentFolder);
    }

    const filePath = path.join(folderPath, fileName);

    if (!fs.existsSync(filePath)) {
        return res.status(400).send({ message: 'Файл не найден' });
    }

    res.download(filePath);
});

app.delete('/folder', (req, res) => {
    const { username, name, parentFolder = '' } = req.body;
    const folderPath = path.join(usersFolderPath, username, parentFolder, name);

    if (!fs.existsSync(folderPath) || !fs.lstatSync(folderPath).isDirectory()) {
        return res.status(400).json({ message: 'Папка не найдена' });
    }

    try {
        fs.rmSync(folderPath, { recursive: true, force: true });
        res.json({ message: 'Папка успешно удалена' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера при удалении папки' });
    }
});

app.delete('/file', (req, res) => {
    const { username, name, parentFolder = '' } = req.body;
    const filePath = path.join(usersFolderPath, username, parentFolder, name);

    if (!fs.existsSync(filePath) || !fs.lstatSync(filePath).isFile()) {
        return res.status(400).json({ message: 'Файл не найден' });
    }

    try {
        fs.unlinkSync(filePath);
        res.json({ message: 'Файл успешно удалён' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Ошибка сервера при удалении файла' });
    }
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
