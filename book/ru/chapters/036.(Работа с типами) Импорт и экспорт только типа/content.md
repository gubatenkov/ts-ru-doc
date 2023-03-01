# Импорт и экспорт только типа

На самом деле привычный всем механизм импорта\экспорта таит в себе множество курьезов способных нарушить ожидаемый ход выполнения программы. Помимо детального рассмотрения каждого из них, текущая глава также расскажет о способах их разрешения.


## Предыстория возникновения import type и export type

Представьте сценарий, по которому существуют два модуля, включающих экспорт класса. Один из этих классов использует другой в аннотации типа своего единственного параметра конструктора, что требует от модуля в котором он реализован, импорта другого модуля. Подвох заключается в том, что несмотря на использование класса в качестве типа, модуль в котором он определен вместе с его содержимом, все равно будет скомпилирован в конечную сборку.

`````ts
// @filename: ./SecondLevel.ts
export class SecondLevel {
    
}
`````
`````ts
// @filename: ./FirstLevel.ts
import {SecondLevel} from "./SecondLevel";

export class FirstLevel {
    /**
     * класс SecondLevel используется
     * только как тип 
     */
    constructor(secondLevel: SecondLevel){}
}
`````
`````ts
// @filename: ./index.js
export { FirstLevel } from "./FirstLevel";
`````

`````js
// @info: скомпилированный проект

// @filename: ./SecondLevel.js
export class SecondLevel {
}

// @filename: ./FirstLevel.js
/**
 * Несмотря на то, что от класса SecondLevel не осталось и следа,
 * модуль *, в котором он определен, все равно включен в сборку.
 */
import "./SecondLevel"; // <-- *
export class FirstLevel {
    /**
     * класс SecondLevel используется
     * только как тип
     */
    constructor(secondLevel) { }
}

// @filename: ./index.js
export { FirstLevel } from "./FirstLevel";
`````

При использовании допустимых _JavaScript_ конструкций исключительно в качестве типа, было бы разумно ожидать, что конечная сборка не будет обременена модулями, в которых они определены. Кроме того, конструкции, присущие только _TypeScript_, не попадают в конечную сборку, в отличие от модулей, в которых они определенны. Если в нашем примере поменять тип конструкции `SecondLevel` с класса на интерфейс, то модуль `./FirstLevel.js` все равно будет содержать импорт модуля `./SecondLevel.js`, содержащего экспорт пустого объекта `export {};`. Не лишним будут обратить внимание, что в случае с интерфейсом, определяющий его модуль мог содержать и другие конструкции. И если бы среди этих конструкций оказались допустимые с точки зрения _JavaScript_, то они, на основании изложенного ранее, попали бы в конечную сборку. Даже если бы вообще не использовались.

Это поведение привело к тому, что в _TypeScript_ появился механизм импорта и экспорта только типа. Этот механизм позволяет устранить рассмотренные случаи. Тем не менее, имеется несколько нюансов, которые будут подробно изложены далее.


## import type и export type - форма объявления

Форма уточняющего _импорта и экспорта только типа_ включает в себя ключевое слово `type`, идущее следом за ключевым словом `import` либо `export`.
 
`````ts
import type { Type } from './type';
export type { Type };
`````

Ключевое слово `type` можно размещать в выражениях импорта, экспорта, а также ре-экспорта.

`````ts
// @filename: ./ClassType.ts

export class ClassType {
    
}
`````

`````ts
// @filename: ./index.js

import type { ClassType } from "./types"; // Ok -> импорт только типа

export type { ClassType }; // Ok -> экспорт только типа 
`````

`````ts
// @filename: ./index.js

export type { ClassType } from "./types"; // Ok -> ре-экспорт только типа 
`````

Единственное отличие импорта и экспорта только типа от обычных одноименных инструкций состоит в невозможности импортировать в одной форме обычный импорт/экспорт и по умолчанию.

`````ts
// @filename: ./types.ts

export default class DefaultClassType {}
export class ClassType {}
`````
`````ts
// @filename: ./index.js

// пример с обычным импортом

import DefaultClassType, { ClassType } from "./types"; // Ok -> обычный импорт
`````
`````ts
// @filename: ./index.js

// неправильный пример с импортом только типа

import type DefaultClassType, { ClassType } from "./types"; // Error -> импорт только типа

/**
 * [0] A type-only import can specify a default import or named bindings, but not both.
 */
`````

Как можно почерпнуть из текста ошибки, решение заключается в создании отдельных форм импорта.

`````ts
// @filename: ./index.js

// правильный пример с импортом только типа

import type DefaultClassType from "./types"; // Ok -> импорт только типа по умолчанию
import type { ClassType } from "./types"; // Ok -> импорт только типа
`````


## Импорт и экспорт только типа на практике

Прежде всего перед рассматриваемым механизмом стоит задача недопущения использования импортированных или экспортированных только как тип конструкций и значений в роли, отличной от обычного типа. Другими словами, допустимые _JavaScript_ конструкции и значения нельзя использовать в привычных для них выражениях. Нельзя создавать экземпляры классов, вызывать функции и использовать значения, ассоциированные с переменными.

`````ts
// filename: ./types.ts

export class ClassType {}
export interface IInterfaceType {}
export type AliasType = {};

export const o = {person: '🧟'};

export const fe = () => {};
export function fd() {}
`````

`````ts
import type { o, fe, fd, ClassType, IInterfaceType } from './types'; // Ok

/**
 * * - '{{NAME}}' cannot be used as a value because it was imported using 'import type'.
 */

let person = o.person; // Error -> *
fe(); // Error -> *
fd(); // Error -> *
new ClassType(); // Error -> *

`````

Не сложно догадаться, что значения и функции импортированные или экспортированные только как типы необходимо использовать в совокупности с другим механизмом, называемым _запрос типа_.

`````ts 
import type { o, fe, fd, ClassType, IInterfaceType } from './types';

/**
 * v2, v3 и v4 используют механизм
 * запроса типа
 */

let v0: IInterfaceType; // Ok -> let v0: IInterfaceType
let v1: ClassType; // Ok -> let v1: ClassType
let v2: typeof fd; // Ok -> let v2: () => void
let v3: typeof fe; // Ok -> let v3: () => void
let v4: typeof o; // Ok -> let v4: {person: string;}
````` 

Будет не лишним уточнить, что классы, экспортированные как уточнённые, не могут участвовать в механизме наследования.

`````ts
// @filename: Base.ts

export class Base {}
`````

`````ts
// @filename: index.js

import type { Base } from "./Base";

/**
 * Error -> 'Base' cannot be used as a value because it was imported using 'import type'.
 */
class Derived extends Base {}
`````

## Вспомогательный флаг --importsNotUsedAsValues

Другая задача, решаемая с помощью данного механизма, заключается в управлении включения модулей в конечную сборку при помощи вспомогательного флага `--importsNotUsedAsValues`, значение которого может принадлежать к одному из трех вариантов. Но прежде чем познакомится с каждым из них, необходимо поглубже погрузиться в природу возникновения необходимости в данном механизме.

Большинство разработчиков, пользуясь механизмом импорта/экспорта в повседневной работе, даже не подозревают, что с ним связанно немало различных трудностей, возникающих из-за механизмов, призванных оптимизировать код. Но для начала рассмотрим несколько простых вводных примеров.

Представьте ситуацию, при которой один модуль импортирует необходимый ему тип, представленный интерфейсом.

`````ts
// @filename IPerson.ts

export interface IPerson {
    name: string;
}
`````

`````ts
// @filename action.ts

import { IPerson } from './IPerson';

function action(person: IPerson) {
    // ...
}
`````

Поскольку интерфейс является конструкцией присущей исключительно _TypeScript_, то неудивительно, что после компиляции от неё и модуля, в которой она определена, не останется и следа.

`````js
// после компиляции @file action.js

function action(person) {
    // ...
}
`````

Теперь представьте, что один модуль импортирует конструкцию, представленную классом, который задействован в логике уже знакомой нам функции `action()`.

`````ts
// @file IPerson.ts

export interface IPerson {
    name: string;
}
`````

`````ts
// @file IPerson.ts

export class Person {
    constructor(readonly name: string) {}

    toString() {
        return `[person ${this.name}]`;
    }
}
`````

`````ts
// @file Person.ts

import { IPerson } from './IPerson';
import { Person } from './Person';

function action(person: IPerson) {
    new Person(person);
}

`````

`````js
// после компиляции @file action.js

import { Person } from './Person';


function action(person) {
    new Person(person);
}

`````

В этом случае класс `Person` был включён в скомпилированный файл, поскольку необходим для правильного выполнения программы.

А теперь представьте ситуацию, когда класс `Person` задействован в том же модуле `action.ts`, но исключительно в качестве типа. Другими словами, он не задействован в логике работы модуля.

`````ts
// @file Person.ts

export class Person {
    constructor(readonly name:string) {}

    toString() {
        return `[person ${this.name}]`;
    }
}
`````

`````ts
// @file action.ts

import { Person } from './Person';

function action(person: Person) {
    //...
}
`````

Подумайте, что должна включать в себя итоговая сборка? Если вы выбрали вариант идентичный первому, то вы совершенно правы! Поскольку класс `Person` используется в качестве типа, то нет смысла включать его в результирующий файл.

`````js
// после компиляции @file action.js

function action(person) {
    //...
}
`````

Подобное поведение кажется логичным и возможно благодаря механизму, называемому _import elision_. Этот механизм определяет, что конструкции, которые теоретически могут быть включены в скомпилированный модуль, требуются ему исключительно в качестве типа. И, как уже можно было догадаться, именно с этим механизмом и связаны моменты, мешающие оптимизации кода.

Рассмотрим пример состоящий из двух модулей. Первый модуль экспортирует объявленные в нем интерфейс и функцию, использующую этот интерфейс в аннотации типа своего единственного параметра. Второй модуль лишь ре-экспортирует интерфейс и функцию из первого модуля.

`````ts
// @filename module.ts

export interface IActionParams {}
export function action(params: IActionParams) {}
`````

`````ts
// @filename re-export.ts

import { IActionParams, action } from './types';

/**
 * Error -> Re-exporting a type when the '--isolatedModules' flag is provided requires using 'export type'
 */
export { IActionParams, action };
`````

Поскольку компиляторы, как TypeScript, так и Babel, неспособны определить, является ли конструкция `IActionParams` допустимой для _JavaScript_ в контексте файла, существует вероятность возникновения ошибки. Простыми словами, механизмы обоих компиляторов не знают нужно ли удалять следы, связанные с `IActionParams` из скомпилированного _JavaScript_ кода или нет. Именно поэтому существует флаг `--isolatedModules`, активация которого заставляет компилятор предупреждать об опасности данной ситуации.

Механизм уточнения способен разрешить возникающие перед _import elision_ трудности ре-экспорта модулей, предотвращению которых способствует активация флага `--isolatedModules`.

Рассмотренный выше случай можно разрешить с помощью явного уточнения формы импорта/экспорта.

`````ts
// @filename: re-export.ts

import { IActionParams, action } from './module';

/**
 * Явно указываем, что IActionParams это тип.
 */
export type { IActionParams };
export { action };

`````

Специально введенный и ранее упомянутый флаг `--importsNotUsedAsValues` ожидает одно из трех возможных на данный момент значений - `remove`, `preserve` или `error`.

Значение `remove` реализует поведение по умолчанию и которое обсуждалось на протяжении всей главы.

Значение `preserve` способно разрешить проблему, возникающую при экспорте так называемых _сайд-эффектов_.

`````ts
// @filename: module-with-side-effects.ts

function incrementVisitCounterLocalStorage() {
    // увеличиваем счетчик посещаемости в localStorage
}

export interface IDataFromModuleWithSideEffects {};

incrementVisitCounterLocalStorage(); // ожидается, что вызов произойдет в момент подключения модуля
`````

`````ts
// @filename: index.js

import { IDataFromModuleWithSideEffects } from './module';

let data: IDataFromModuleWithSideEffects = {};
`````

Несмотря на то, что модуль `module-with-side-effects.ts` задействован в коде, его содержимое не будет включено в скомпилированную программу, поскольку компилятор исключает импорты конструкций, не участвующих в её логике. Таким образом функция `incrementVisitCounterLocalStorage()` никогда не будет вызвана, а значит программа не будет работать корректно!

`````js
// @filename: index.js
// после компиляции 

let data = {};
`````

Решение этой проблемы заключается в повторном указании импорта всего модуля. Но не всем такое решение кажется очевидным.

`````ts
import {IDataFromModuleWithSideEffects} from './module-with-side-effects';
import './module-with-side-effects'; // импорт всего модуля

let data: IDataFromModuleWithSideEffects = {};
`````

Теперь программа выполнится так как и ожидалось. То есть модуль `module-with-side-effects.ts` включен в её состав.

`````js
// @filename: index.js
// после компиляции

import './module-with-side-effects.js';

let data = {};
`````

Кроме того, сама _ide_ укажет на возможность уточнения _импорта только типов_, что в свою очередь должно подтолкнуть на размышление об удалении импорта при компиляции.

`````ts
import { IDataFromModuleWithSideEffects } from './module-with-side-effects'; // This import may be converted to a type-only import.ts(1372)
`````

Также флаг `preserve` в отсутствие уточнения поможет избавиться от повторного указания импорта. Простыми словами значение `preserve` указывает компилятору импортировать все модули полностью.

`````ts
// @filename: module-with-side-effects.ts

function incrementVisitCounterLocalStorage() {
    // увеличиваем счетчик посещаемости в localStorage
}

export interface IDataFromModuleWithSideEffects {};

incrementVisitCounterLocalStorage();
`````

`````ts
// @filename: module-without-side-effects.ts

export interface IDataFromModuleWithoutSideEffects {};
`````

`````ts
// @filename: index.js

// Без уточнения
import { IDataFromModuleWithSideEffects } from './module-with-side-effects';
import { IDataFromModuleWithoutSideEffects } from './module-without-side-effects';

let dataFromModuleWithSideEffects: IDataFromModuleWithSideEffects = {};
let dataFromModuleWithoutSideEffects: IDataFromModuleWithoutSideEffects = {};
`````

Несмотря на то, что импортировались исключительно конструкции-типы, как и предполагалось, модули были импортированы целиком.

`````js
// после компиляции @file index.js

import './module-with-side-effects';
import './module-without-side-effects';

let dataFromModuleWithSideEffects = {};
let dataFromModuleWithoutSideEffects = {};
`````

В случае уточнения поведение при компиляции останется прежним. То есть импорты в скомпилированный файл включены не будут.

`````ts
// @filename: index.js

// С уточнением
import type { IDataFromModuleWithSideEffects } from './module-with-side-effects';
import type { IDataFromModuleWithoutSideEffects } from './module-without-side-effects';


let dataFromModuleWithSideEffects: IDataFromModuleWithSideEffects = {};
let dataFromModuleWithoutSideEffects: IDataFromModuleWithoutSideEffects = {};
`````

Импорты модулей будут отсутствовать.

`````js
// @filename: index.js
// после компиляции

let dataFromModuleWithSideEffects = {};
let dataFromModuleWithoutSideEffects = {};
`````

Если флаг `--importsNotUsedAsValues` имеет значение `error`, то при импортировании типов без явного уточнения будет считаться ошибочным поведением.

`````ts
// @filename: index.js

/**
 *
 * [0][1] Error > This import is never used as a value and must use 'import type' because the 'importsNotUsedAsValues' is set to 'error'.ts(1371)
 */

import { IDataFromModuleWithSideEffects } from './module-with-side-effects';
import { IDataFromModuleWithoutSideEffects } from './module-without-side-effects';

let dataFromModuleWithSideEffects: IDataFromModuleWithSideEffects = {};
let dataFromModuleWithoutSideEffects: IDataFromModuleWithoutSideEffects = {};
`````

Скомпилированный код после устранения ошибок, то есть после уточнения, включать в себя импорты не будет.

В заключение стоит заметить, что, теоретически, уточнение класса, используемого только в качестве типа, способно ускорить компиляцию, поскольку это избавляет компилятор от ненужных проверок на вовлечении его в логику работы модуля. Кроме того, уточнение формы импорта/экспорта — это ещё один способ сделать код более информативным.


## Разрешение импорта и экспорта только типа с помощью resolution-mode

Компилятор _TypeScript_ умеет успешно разрешать сценарии при импортировании таких модулей, как `CommonJS` и `ECMAScript`. Для разрешения импорта только типа существует отдельный механизм, который осуществляется путем указания после пути до модуля ключевого слова `assert` за которым в фигурных скобках определяется конфигурация позволяющая конкретизировать вид модулей.

`````ts
// Для require()
import type { TypeFromRequere } from "module-name" assert {
    "resolution-mode": "require"
};

// Для import
import type { TypeFromImport } from "module-name" assert {
    "resolution-mode": "import"
};

export interface MergedType extends TypeFromRequere, TypeFromImport {}
`````

Помимо этого, утверждения можно применить и к динамическому импорту..

`````ts
import("module-name", { assert: { "resolution-mode": "require" } }).TypeFromRequire;
import("module-name", { assert: { "resolution-mode": "import" } }).TypeFromImport;
`````

..а также, к коментарной директиве.

`````ts
/// <reference types="module-name" resolution-mode="require" />
/// <reference types="module-name" resolution-mode="import" />
`````