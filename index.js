const fs = require('fs');
const path = require('path');
let jQueryData = '';

async function checkJq(page)
{
	const is_install = await page.evaluate_old(function(){return window.$ !== undefined;});
	if (!is_install)
		await page.evaluate_old(jQueryData);
}

async function evaluate(pageFunction, ...args)
{
	await checkJq(this);
	return await this.evaluate_old(pageFunction, ...args);
}

async function evaluateHandle(pageFunction, ...args)
{
	await checkJq(this);
	return await this.evaluateHandle_old(pageFunction, ...args);
}

async function waitForFunction(pageFunction, options = {}, ...args)
{
	await checkJq(this);
	return await this.waitForFunction_old(pageFunction, options, ...args);
}

async function getHandle(page, code)
{
	handle = await page.evaluateHandle(code);
	const array = [];
	const properties = await handle.getProperties();
	for (const property of properties.values())
	{
		const elementHandle = property.asElement();
		if (elementHandle)
			array.push(elementHandle);
	}
	await handle.dispose();
	return array;
}

async function waitForjQuery(selector, options)
{
	const code = `$('${selector.replace(/'/g, "\\\'")}')`;
	let list;
	list = await getHandle(this, code);
	if (list.length)
		return list;
	await this.waitForFunction(code + `.toArray().length > 0`, options, code);
	list = await getHandle(this, code);
	return list;
}

function isString(obj)
{
	return typeof obj === 'string' || obj instanceof String;
}

const handlerRoot = {
	get(target, p, receiver)
	{
		if (typeof p == 'symbol')
			return target[p];
		let key = p.toString();
		switch (key)
		{
			case 'toString':
			case 'valueOf':
			return target[p];
			case 'code':
			case 'selector':
			case 'page':
			return target[p];
			case 'then':
			return (...args) => {
				const lastExec = target.exec(true);
				return lastExec.then(...args);
			};
			case 'exec':
			return (...args) => {
				return target.exec(true);
			};
		}
		return (...args) =>
		{
			args = args.map((arg) =>
			{
				if (isString(arg))
					return JSON.stringify(arg);
				if (typeof arg === 'function')
					return arg.toString();
				return JSON.stringify(arg);
			});
			let newCode = `${target.code}.${key}(${args.join(',')})`;
			if (args.length === 0)
			{
				switch (key)
				{
					case 'text':
					case 'html':
					case 'val':
					case 'css':
					const tmp = new JqApi(target.page, target.selector, newCode);
					return tmp.exec(false);
				}
			}
			let child = new JqApi(target.page, target.selector, newCode);
			return new Proxy(child, handlerRoot);
		}
	}
}


class JqApi
{
	constructor(page, selector, code)
	{
		this.page = page;
		this.selector = selector;
		this.code = code;
	}

	async exec(is_selector)
	{
		const code = `$('${this.selector.replace(/'/g, "\\\'")}')` + this.code;
		if (is_selector)
		{
			const handle = await this.page.evaluateHandle(code);
			const json = await handle.jsonValue();
			const is_handle = (json.context !== undefined);
			if (is_handle)
				return getHandle(this.page, code);
			else
				return await this.page.evaluate(code);
		}
		else
			return await this.page.evaluate(code);
	}
}


function inject(page)
{
	if (jQueryData == '')
		jQueryData = fs.readFileSync(path.join(__dirname, 'js', 'jquery-3.5.1.min.js'), { encoding: 'utf-8' });

	page.evaluate_old = page.evaluate;
	page.evaluate = evaluate;

	page.evaluateHandle_old = page.evaluateHandle;
	page.evaluateHandle = evaluateHandle;

	page.waitForFunction_old = page.waitForFunction;
	page.waitForFunction = waitForFunction;

	page.waitForjQuery = waitForjQuery;

	page.jQuery = function(selector) {return new Proxy(new JqApi(this, selector, ''), handlerRoot);};
	return page;
}


exports.inject = inject;