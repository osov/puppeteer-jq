# puppeteer-jq
Библиотека для поддержки jQuery методов в puppeteer.
 
 ### Использование

Установка через npm:
`npm install git+https://github.com/osov/puppeteer-jq`

```
const jQuery = require('puppeteer-jq'); // если ставили через npm
const jQuery = require('./puppeteer-jq-main'); // если скачали руками

....

// инъекция в страницу
let page = jQuery.inject(await browser.newPage());
```
 
  ### Ожидание появления селектора
 ```JavaScript
page.waitForjQuery(selector) : array

```
Пример:
 ```JavaScript
await page.waitForjQuery(".test");
const text = await page.jQuery(".test").text();
```

  ### Стандартные методы в которых подключается jQuery
При их вызове автоматически доступны все методы jQuery, $.
 ```JavaScript
1)page.evaluate
2)page.evaluateHandle
3)page.waitForFunction
```

  ### Селекторы jQuery и манипуляция 
 ```JavaScript
const text = await page.jQuery("body").find("h1").text();
await page.jQuery("body").find("h2").text('empty');
```
