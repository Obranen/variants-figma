const fs = require('fs');
const path = require('path');

// Пути к файлам и папкам
const variablesDir = path.join(__dirname, 'variables');
const variablesFile = path.join(variablesDir, 'variables.css');
const buildDir = path.join(variablesDir, 'build');
const outputFile = path.join(buildDir, 'tailwind-variables.css');

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

// Сохраняем оригинальные секции :root для вывода
const originalSections = content.match(/\/\*\s*(light|dark)\s*\*\/\s*:root(\[data-theme='dark'\])?\s*{[\s\S]*?}\s*/g) || [];

// Шаг 5: Парсим переменные из разных секций
const variables = {
  light: {},
  dark: {},
  globals: {}
};

// @ts-ignore - отключаем проверки TypeScript для динамических объектов

// Разбиваем контент на секции
const sections = content.split(/\/\*\s*(globals|light|dark)\s*\*\/\s*:root(\[data-theme='dark'\])?\s*{([\s\S]*?)}\s*/);

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
        if (sectionType === 'globals') {
          // @ts-ignore
          variables.globals[name] = value.trim();
        } else if (sectionType === 'light') {
          // @ts-ignore
          variables.light[name] = value.trim();
        } else if (sectionType === 'dark') {
          // @ts-ignore
          variables.dark[name] = value.trim();
        }
      }
    });
  }
}

console.log('✅ Извлечены переменные из всех секций');

// Шаг 6: Собираем переменные для @theme блока
const themeVariables = {};

// Добавляем breakpoint переменные из globals
Object.keys(variables.globals).forEach(name => {
  if (name.startsWith('--breakpoint')) {
    // @ts-ignore
    themeVariables[name] = variables.globals[name];
  }
});

// Добавляем переменные из light секции
Object.keys(variables.light).forEach(name => {
  // @ts-ignore
  themeVariables[name] = variables.light[name];
});

// Добавляем переменные из dark секции
Object.keys(variables.dark).forEach(name => {
  // @ts-ignore
  themeVariables[name] = variables.dark[name];
});

// Удаляем дубликаты (оставляем последнее значение)
const uniqueVariables = {};
Object.keys(themeVariables).forEach(name => {
  // @ts-ignore
  uniqueVariables[name] = themeVariables[name];
});

console.log(`✅ Собрано ${Object.keys(uniqueVariables).length} уникальных переменных`);

// Шаг 7: Создаем финальный контент
let themeContent = '';

// Добавляем оригинальные секции :root
originalSections.forEach(section => {
  themeContent += section + '\n\n';
});

// Создаем @theme блок с var() ссылками
// @ts-ignore
const themeVars = [];
// @ts-ignore
const breakpointVars = [];

// Добавляем переменные из light секции как var()
Object.keys(variables.light).forEach(name => {
  let key = name;
  if (name.startsWith('--color-')) {
    const prefix = name.split('-')[2];
    const suffix = name.split('-').slice(2).join('-');
    key = `--${prefix}-${suffix}`;
  }
  themeVars.push(`  ${key}: var(${name});`);
});

// Добавляем breakpoint переменные
Object.keys(variables.globals).forEach(name => {
  if (name.startsWith('--breakpoint')) {
    const prefix = name.split('-')[2];
    const suffix = name.split('-').slice(2).join('-');
    const key = `--${prefix}-${suffix}`;
    // @ts-ignore
    breakpointVars.push(`  ${key}: ${variables.globals[name]};`);
  }
});

// Собираем @theme блок
if (themeVars.length > 0 || breakpointVars.length > 0) {
  themeContent += '@theme {\n';
  // @ts-ignore
  themeContent += themeVars.concat(breakpointVars).join('\n');
  themeContent += '\n}\n';
}

console.log('✅ Сформирован контент для @theme блоков');

// Шаг 8: Создаем папку build и файл tailwind-variables.css
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('✅ Создана папка variables/build/');
}

fs.writeFileSync(outputFile, themeContent, 'utf8');
console.log('✅ Создан файл variables/build/tailwind-variables.css');

console.log('\n🎉 Обработка завершена успешно!');
console.log(`📊 Результат: ${Object.keys(uniqueVariables).length} переменных обработано`);
console.log(`📁 Выходной файл: ${outputFile}`);