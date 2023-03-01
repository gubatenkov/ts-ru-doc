## Импорт и экспорт только типа и флаг --importsNotUsedAsValues

Механизм уточнения импорта и экспорта (`import\export`) выступает в качестве указаний компилятору, что данную конструкцию следует воспринимать исключительно как тип. Форма уточняющего импорта и экспорта включает в себя ключевое слово `type` идущее следом за ключевым словом `import` либо `export`.

`````ts
import type {Type} from "./type";
export type {Type};
`````

Уточнению могут подвергаться только конструкции расцениваемые исключительно как типы (`interface`, `type alias` и `class`). 

`````ts
// @file types.ts

export class ClassType {}
export interface IInterfaceType{}
export type AliasType = {};
`````

`````ts
// @file index.js

import type {ClassType, IInterfaceType, AliasType} from "./types";
export type {ClassType, IInterfaceType, AliasType};
`````

Значения к которым можно отнести как экземпляры объектов, так и функции (`function expression` и `function declaration`) уточнятся, как в отдельности так и в одной форме с типами, не могут.

`````ts
// @file types.ts

export class ClassType {}
export interface IInterfaceType{}
export type AliasType = {};


export const o = {};

export const fe = ()=>{};
export function fd(){}
`````

`````ts
// @file index.js

// import type {o, fe, fd} from "./types"; // Error! Type-only import must reference a type, but 'o' is a value.ts(1361)
// import type {o, fe, fd, ClassType, IInterfaceType, AliasType} from "./types"; // Error! Type-only import must reference a type, but 'o' is a value.ts(1361)
import {o, fe, fd} from "./types"; // Ok!


// export type {o, fe, fd}; // Error! Type-only export must reference a type, but 'o' is a value.ts(1361)
// export type {o, fe, fd, ClassType, IInterfaceType, AliasType} from "./types"; // Error! Type-only export must reference a type, but 'o' is a value.ts(1361)
export {o, fe, fd}; // Ok!
`````

Кроме того, уточнённая форма импорта и экспорта не может одновременно содержать импорт\экспорт по умолчанию и не по умолчанию.

`````ts
// @file types.ts

export default class DefaultExportType {}
export class ExportType {}
`````

`````ts
// @file index.js

/**
 * Error!
 * All imports in import declaration are unused.ts(6192)
 * A type-only import can specify a default import or named bindings, but not both.ts(1363)
 */
import type DefaultType, {ExportType} from "./types";
`````

Также не будет лишним оговорить, что классы экспортированные как уточненные само собой разумеется не могут участвовать в механизме наследования.

`````ts
// @file Base.ts

export class Base {}
`````

`````ts
// @file index.js

import type {Base} from "./Base";

class Derived extends Base{}; // 'Base' only refers to a type, but is being used as a value here.ts(2693)

`````

В дополнение механизму уточнения формы импорта\экспорта был добавлен флаг `--importsNotUsedAsValues` ожидаемый одно из трех значений. Но прежде чем познакомится с каждым предлагаю поглубже погрузится в природу возникновения необходимости в данном механизме.

Большинство разработчиков используя в повседневной работе механизм импорта\экспорта даже не подозревают, что с ним связанно немало различных трудностей, которые возникают из-за механизмов призванных оптимизировать код. Но для начала рассмотрим несколько простых вводных примеров.

Представьте ситуацию при которой один модуль импортирует необходимый ему тип представленный такой конструкцией как `interface`.

`````ts
// @file IPerson.ts

export interface IPerson {
    name: string;
}
`````

`````ts

// @file action.ts

import {IPerson} from "./IPerson";

function action(person:IPerson){
    // ...
}
`````

Поскольку интерфейс является конструкцией присущей исключительно _TypeScript_, то не удивительно, что после компиляции от неё не останется и следа.

`````js
// после компиляции @file action.js

function action(person){
    // ...
}
`````

Теперь представьте, что один модуль импортирует конструкцию представленную классом, который задействован в логике уже знакомой нам функции `action()`.

`````ts
// @file IPerson.ts

export interface IPerson {
    name: string;
}

export class Person {
    constructor(readonly name:string){}

    toString(){
        return `[person ${this.name}]`;
    }
}

`````

`````ts
// @file action.ts

import {IPerson} from "./IPerson";
import {Person} from "./Person";


function action(person:IPerson){
    new Person(person);
}

`````

`````js
// после компиляции @file action.js

import {Person} from "./Person";


function action(person){
    new Person(person);
}

`````

В этом случае класс `Person` был включён в скомпилированный файл поскольку необходим для правильного выполнения программы.

А теперь представьте ситуацию когда класс `Person` задействован в том же модуле `action.ts`, но исключительно в качестве типа. Другими словами он не задействован в логике работы модуля.

`````ts
// @file Person.ts

export class Person {
    constructor(readonly name:string){}

    toString(){
        return `[person ${this.name}]`;
    }
}
`````

`````ts

// @file action.ts

import {Person} from "./Person";


function action(person:Person){
    //...
}
`````

Подумайте, что должна включать в себя итоговая сборка? Если вы выбрали вариант идентичный первому, то вы совершенно правы! Поскольку класс `Person` используется в качестве типа, то нет смысла включать его в результирующий файл.

`````js
// после компиляции @file action.js


function action(person){
    //...
}
`````

Подобное поведение кажется логичным и возможно благодаря механизму называемому _import elision_. Этот механизм определяет, что конструкции которые теоретически могут быть включены в скомпилированный модуль требуются ему исключительно в качестве типа. И как уже можно было догадаться именно с этим механизмом и связанны моменты мешающие оптимизаций кода. Тут-то и вступает в дело механизм уточнения формы импорта\экспорта.

Механизм уточнения способен разрешить возникающие перед _import-elision_ трудности при ре-экспорте модулей предотвращению которых способствует установленный в значение `true` флаг `--isolatedModules`.

`````ts
// @file module.ts
export interface IActionParams{}
export function action(params:IActionParams){}
`````

`````ts
// @file re-export.ts

import {IActionParams, action} from "./module";

/**
 * [Error! ts <3.8] > Cannot re-export a type when the '--isolatedModules' flag is provided.ts(1205)
 * 
 * [Error! ts >=3.8] > Re-exporting a type when the '--isolatedModules' flag is provided requires using 'export type'.ts(1205)
 */
export {IActionParams, action};


/**
 * 
 * Поскольку компиляторы как TypeScript так и Babel
 * в контексте файла неспособны определить является
 * ли конструкция IActionParams допустимой для JavaScript
 * существует вероятность возникновения ошибки. Простыми
 * словами механизмы обоих компиляторов не знаю нужно ли
 * удалять следы связанные с IActionParams из скомпилированного
 * .js кода или нет. Именно поэтому был добавлен флаг 
 * --isolatedModules который предупреждает о опасной ситуации.
 */

 
`````

Рассмотренный выше случай можно разрешить с помощью явного уточнения формы импорта\экспорта.

`````ts
// @file re-export.ts

import {IActionParams, action} from "./module";

/**
 * Явно указываем, что IActionParams это тип.
 */
export type {IActionParams};
export {action};

`````


Специально введенный и ранее упомянутый флаг `--importsNotUsedAsValues`, как уже было сказано, ожидает одно из трех возможных на данный момент значений - `remove`, `preserve` или `error`.

Значение `remove` активирует или другими словами оставляет поведение реализуемое до версии `3.8`.
Значения `preserve` способно разрешить проблему возникающую при экспорте так называемых сайд-эффектов.

`````ts
// @file module-with-side-effects.ts

function incrementVisitCounterLocalStorage(){
    // увеличиваем счетчик посещаемости в localStorage
}

export interface IDataFromModuleWithSideEffects{};

incrementVisitCounterLocalStorage(); // ожидается, что вызов произойдет в момент подключения модуля
`````

`````ts
// @file index.js

import {IDataFromModuleWithSideEffects} from "./module";

let data:IDataFromModuleWithSideEffects = {};

/**
 * Несмотря на то, что модуль module.ts
 * задействован в коде, его содержимое
 * не будет включено в скомпилированную
 * программу, поскольку компилятор исключает
 * импорты конструкций не участвующих в её логике.
 * Таким образом функция incrementVisitCounterLocalStorage()
 * никогда не будет вызвана, а значит программа не будет
 * работать корректно! 
 */

`````
`````js
// после компиляции @file index.js

let data = {};

/**
 * В итоге программе ничего не
 * известно о модуле module-with-side-effects.ts
 */
`````

Решение из ситуации описанной выше заключается в повторном указании импорта всего модуля. Но не всем такое решение кажется очевидным.

`````ts
import {IDataFromModuleWithSideEffects} from "./module-with-side-effects";
import "./module-with-side-effects"; // импорт всего модуля

let data:IDataFromModuleWithSideEffects = {};
`````

`````js
// после компиляции @file index.js

import "./module-with-side-effects.js";

let data = {};

/**
 * Теперь программа выполнится так как и ожидалось.
 * То есть модуль module-with-side-effects.ts включен
 * в её состав.
 */
`````

Поэтому прежде всего начиная с версии `3.8` сама `ide` укажет на возможность уточнения импорта исключительно типов, что в свою очередь должно подтолкнуть на размышление об удалении импорта при компиляции.

`````ts
import {IDataFromModuleWithSideEffects} from "./module-with-side-effects"; //This import may be converted to a type-only import.ts(1372)
`````

Кроме того, флаг `preserve` в отсутствие уточнения поможет избавиться от повторного указания импорта. Простыми словами значение `preserve` указывает компилятору импортировать все модули полностью.


`````ts
// @file module-with-side-effects.ts

function incrementVisitCounterLocalStorage(){
    // увеличиваем счетчик посещаемости в localStorage
}

export interface IDataFromModuleWithSideEffects{};

incrementVisitCounterLocalStorage(); 
`````
`````ts
// @file module-without-side-effects.ts

export interface IDataFromModuleWithoutSideEffects{};
`````
`````ts
// @file index.js


// Без уточнения
import {IDataFromModuleWithSideEffects} from "./module-with-side-effects";
import {IDataFromModuleWithoutSideEffects} from "./module-without-side-effects";


let dataFromModuleWithSideEffects:IDataFromModuleWithSideEffects = {};
let dataFromModuleWithoutSideEffects:IDataFromModuleWithoutSideEffects = {};
`````

`````js
// после компиляции @file index.js

import "./module-with-side-effects";
import "./module-without-side-effects";

let dataFromModuleWithSideEffects = {};
let dataFromModuleWithoutSideEffects = {};

/**
 * 
 * Несмотря на то, что импортировались
 * исключительно конструкции-типы, модули
 * были импортированы полностью.
 */
`````

В случае уточнения поведение при компиляции останется прежним. То есть в импорты в скомпилированный файл включены не будут.
 
`````ts
// @file index.js


// С уточнением
import type {IDataFromModuleWithSideEffects} from "./module-with-side-effects";
import type {IDataFromModuleWithoutSideEffects} from "./module-without-side-effects";


let dataFromModuleWithSideEffects:IDataFromModuleWithSideEffects = {};
let dataFromModuleWithoutSideEffects:IDataFromModuleWithoutSideEffects = {};
`````

`````js
// после компиляции @file index.js

let dataFromModuleWithSideEffects = {};
let dataFromModuleWithoutSideEffects = {};

/**
 * 
 * Импорты отсутствуют.
 */
`````

Если же флагу `--importsNotUsedAsValues` задано значение `error`, то при импортировании типов без явного уточнения будет считаться ошибочным поведением.

`````ts
// @file index.js

/**
 * 
 * [0][1] Error > This import is never used as a value and must use 'import type' because the 'importsNotUsedAsValues' is set to 'error'.ts(1371)
 */

import {IDataFromModuleWithSideEffects} from "./module-with-side-effects";
import {IDataFromModuleWithoutSideEffects} from "./module-without-side-effects";


let dataFromModuleWithSideEffects:IDataFromModuleWithSideEffects = {};
let dataFromModuleWithoutSideEffects:IDataFromModuleWithoutSideEffects = {};
`````

Скомпилированный код выше после устранения ошибок, то есть после уточнения, включать в себя импорты не будет.

В заключение стоит заметить, что в теории уточнение такой конструкции, как класс, способно ускорить компиляцию, поскольку избавляет компилятор от ненужных проверок на вовлечении его в логику работы модуля. Ну и, кроме того, уточнения формы импорта\экспорта, это ещё один способ сделать код более информативным.
