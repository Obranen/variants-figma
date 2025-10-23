const fs = require('fs');
const path = require('path');

// Пути к файлам и папкам
const variablesDir = path.join(__dirname, 'variables');
const variablesFile = path.join(variablesDir, 'variables.css');
const buildDir = path.join(variablesDir, 'build');
const outputFile = path.join(buildDir, 'tailwind-variables.css');
const outputFileFigmaCode = path.join(buildDir, 'tailwind-variables-figma-code.css');

console.log('🚀 Начинаем обработку variables.css...');

// Шаг 1: Проверяем и создаем папку variables если не существует
if (!fs.existsSync(variablesDir)) {
  fs.mkdirSync(variablesDir, { recursive: true });
  console.log('✅ Создана папка variables/');
}

// Шаг 2: Проверяем файл variables.css
let content;
if (fs.existsSync(variablesFile)) {
  content = fs.readFileSync(variablesFile, 'utf8');
  console.log('✅ Найден файл variables.css');
} else {
  console.log('❌ Файл variables.css не найден');
  process.exit(1);
}

// Шаг 3: Удаляем комментарии /* Mode 1 */
content = content.replace(/\/\*\s*Mode\s*1\s*\*\/\s*\n/g, '');
console.log('✅ Удалены комментарии /* Mode 1 */');

// Шаг 4: Находим и заменяем /* dark */ :root { на /* dark */ :root[data-theme='dark'] {
content = content.replace(
  /\/\*\s*dark\s*\*\/\s*:root\s*{/g,
  '/* dark */\n:root[data-theme=\'dark\'] {'
);
console.log('✅ Обновлен селектор для темной темы');

// Массив префиксов, которые добавляются в @theme без var()
const ignorePrefixes = ['breakpoint'];

// Сохраняем оригинальные секции :root для вывода
const originalSections = content.match(/\/\*\s*(light|dark)\s*\*\/\s*:root(\[data-theme='dark'\])?\s*{[\s\S]*?}\s*/g) || [];

// Шаг 5: Парсим переменные из разных секций
const themeVariables = {};

// @ts-ignore - отключаем проверки TypeScript для динамических объектов

// Разбиваем контент на секции
const sections = content.split(/\/\*\s*(\w+)\s*\*\/\s*:root(\[data-theme='dark'\])?\s*{([\s\S]*?)}\s*/);

for (let i = 1; i < sections.length; i += 4) {
  const sectionType = sections[i];
  const isDarkTheme = sections[i + 1] === '[data-theme=\'dark\']';
  const sectionContent = sections[i + 2];

  if (sectionType && sectionContent) {
    // Извлекаем переменные из секции
    const varMatches = sectionContent.match(/--[\w-]+:\s*[^;]+/g) || [];

    varMatches.forEach(varMatch => {
      const [, name, value] = varMatch.match(/(--[\w-]+):\s*(.+)/) || [];
      if (name && value) {
        // @ts-ignore
        themeVariables[name] = value.trim();
      }
    });
  }
}

console.log('✅ Извлечены переменные из всех секций');

// Удаляем дубликаты (оставляем последнее значение)
const uniqueVariables = {};
Object.keys(themeVariables).forEach(name => {
  // @ts-ignore
  uniqueVariables[name] = themeVariables[name];
});

console.log(`✅ Собрано ${Object.keys(uniqueVariables).length} уникальных переменных`);

// Шаг 6: Создаем финальный контент
let themeContent = '';

// Добавляем оригинальные секции :root
originalSections.forEach(section => {
  themeContent += section + '\n\n';
});

// @ts-ignore
function generateThemeEntry(name, value) {
  const match = name.match(/^--(\w+)-(.+)$/);
  if (match) {
    const prefix = match[1];
    const suffix = match[2];
    const key = `--${prefix}-${suffix}`;
    const val = ignorePrefixes.includes(prefix) ? value : `var(${name})`;
    return `  ${key}: ${val};`;
  }
  return null;
}

// @ts-ignore
function generateThemeEntryFigma(name, value) {
  const match = name.match(/^--(\w+)-(.+)$/);
  if (match) {
    const prefix = match[1];
    const suffix = match[2];
    const key = `--${prefix}-${prefix}-${suffix}`;
    const val = ignorePrefixes.includes(prefix) ? value : `var(${name})`;
    return `  ${key}: ${val};`;
  }
  return null;
}

// @ts-ignore
const themeEntries = [];
Object.keys(uniqueVariables).forEach(name => {
  // @ts-ignore
  const entry = generateThemeEntry(name, uniqueVariables[name]);
  if (entry) {
    themeEntries.push(entry);
  }
});

if (themeEntries.length > 0) {
  themeContent += '@theme {\n';
  // @ts-ignore
  themeContent += themeEntries.join('\n');
  themeContent += '\n}\n';
}

console.log('✅ Сформирован контент для @theme блоков');

// Генерация для Figma Code
// @ts-ignore
const themeEntriesFigma = [];
Object.keys(uniqueVariables).forEach(name => {
  // @ts-ignore
  const entry = generateThemeEntryFigma(name, uniqueVariables[name]);
  if (entry) {
    themeEntriesFigma.push(entry);
  }
});

let themeContentFigma = '';

// Добавляем оригинальные секции :root
originalSections.forEach(section => {
  themeContentFigma += section + '\n\n';
});

if (themeEntriesFigma.length > 0) {
  themeContentFigma += '@theme {\n';
  // @ts-ignore
  themeContentFigma += themeEntriesFigma.join('\n');
  themeContentFigma += '\n}\n';
}

// Шаг 7: Создаем папку build и файл tailwind-variables.css
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('✅ Создана папка variables/build/');
}

fs.writeFileSync(outputFile, themeContent, 'utf8');
console.log('✅ Создан файл variables/build/tailwind-variables.css');
fs.writeFileSync(outputFileFigmaCode, themeContentFigma, 'utf8');
console.log('✅ Создан файл variables/build/tailwind-variables-figma-code.css');

console.log('\n🎉 Обработка завершена успешно!');
console.log(`📊 Результат: ${Object.keys(uniqueVariables).length} переменных обработано`);
console.log(`📁 Выходной файл: ${outputFile}`);