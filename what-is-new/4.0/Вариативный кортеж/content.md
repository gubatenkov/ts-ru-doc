## Вариативный кортеж

Представьте случай при котором перед вами стоит задача реализовать известную всем функцию объединения массивов и кортежей `concat`, и менее известную `tail`, которая возвращает копию полученного в качестве аргумента массива, но только без первого элемента. На `JavaScript` описанные функции выглядели бы подобным образом -

`````js
function concat(a, b){
    return [...a, ...b];
}


function tail(a){
    let [, ...rest] = a;

    return rest;
}

`````

Если бы при попытке добавить типизацию была потребность в аннотации пригодной исключительно для массивов, то дело бы обошлось привычным типом объединения (`Union`) -

`````ts
/**
 * Элементы возвращаемого массива могут
 * принадлежать к типу T или U
 */
function concat<T, U>(a: T[], b: U[]): Array<T | U>{
    return [...a, ...b];
}

/**
 * Возвращаемый массив может содержать
 * элементы принадлежащие к типу T, либо
 * в случаи когда входной массив содержит
 * только один элемент, к типу undefined.
 */
function tail<T>(a: T[]): Array<T> | Array<undefined>{
    let [, ...rest] = a;

    return rest;
}
`````

Но поскольку обсуждаемые функции должны также работать и с кортежами (`Tuple`), то до текущей версии единственный выход заключался в описании множества перегрузок.

`````ts
function concat<A0>(a: [A0], b: []): [A0];
function concat<A0, A1>(a: [A0, A1], b: []): [A0, A1];
function concat<A0, A1, A2>(a: [A0, A1, A2], b: []): [A0, A1, A2];

/**
 * И так до бесконечности!
 * И это только для первого параметра!
 */
`````

Несмотря на силы затраченные для описания множества вариантов перегрузок создать описание покрывающее все возможные случаи все равно не возможно. Поэтому начиная с версии `4.0` _TypeScript_ вносит два фундаментальных изменения позволяющих разрешить описанный случай без описания перегрузок.

Первое нововведение заключается в том, что механизм, известный как `spread` (_распространение_ `[...T]`) в кортежах, теперь может быть универсальным (_generic_). Это позволяет производить над типами массивов и кортежей операции более высокого порядка, что позволяет отказаться от перегрузок в пользу более продвинутого способа.

`````ts
/**
 * 0 - указываем, что параметр типа должен обязательно быть потомком массива.
 * 1 - если T является потомком массива у которого существует первый элемент...
 * 2 - ..., то выбираем остаточные элементы и определяем их как тип R.
 * 3 - при верности условия [1] определяем тип как тип R
 * 4 - при ложном условии [1] определяем тип как тип T (массива переданного в качестве аргумента)
 */
//        [      0      ]    [       1       [     2   ]] [3] [4]
type Tail<T extends unknown[]> = T extends [unknown, ...infer R] ? R : T;

function tail<T extends unknown[]>(arr:  readonly [...T] ): Tail<T> {
    const [, ...rest] = arr;

    return rest as Tail<T>;
}

let tuple = [0, 1, 2, 3] as const;
let array = ['hello', 'world'];

// let v0: string[]
let v0 = tail(array);

// let v1: [1, 2, 3]
let v1 = tail(tuple);

// let v2: [1, 2, 3, ...string[]]
let v2 = tail([...tuple, ...array] as const);
`````

Кроме того, вторым нововведением является возможность указывать `spread` в любой части кортежа, а не только в конце.

`````ts
type Strings = [string, string];
type Numbers = [number, number];

// type Mixed = [string, string, number, number]
type Mixed = [...Strings, ...Numbers];
`````

Когда `spread` применяется к типу без известной длины (обычный массив `...number[]`), то результирующий тип также становится неограниченным и все типы следующие после такого распространения (обычный массив) образуют с ним тип объединение (`Union`).

`````ts
type Strings = [string, string];
type BooleanArray = boolean[];

// type Unbounded0 = [string, string, ...(boolean | symbol)[]]
type Unbounded0 = [...Strings, ...BooleanArray, symbol];

// type Unbounded1 = [string, string, ...(string | boolean | symbol)[]]
type Unbounded1 = [ ...Strings, ...BooleanArray, symbol, ...Strings]
`````

Благодаря этим двум нововведениям теперь стало возможно типизировать функцию `concat` способом исключающим механизм перегрузок.

`````ts
type A = readonly unknown[];

function concat<T extends A, U extends A>(a: T, b: U): [...T, ...U] {
    return [...a, ...b];
}

// let v0: number[]
let v0 = concat([0, 1], [2, 3]);

// let v1: [0, 1, 2, 3]
let v1 = concat([0, 1] as const, [2, 3] as const);

// let v2: [0, 1, ...number[]]
let v2 = concat([0, 1] as const, [2, 3]);

// let v3: number[]
let v3 = concat([0, 1], [2, 3] as const);
`````

Помимо этого новые возможности помогают изящно реализовать более сложные сценарии одним из которых является функция каррирования основанную на `spread` параметрах.

`````ts
function carry(f, ...initialParams){
    return function (...restParams){
        return f(...initialParams, ...restParams);
    }
}
`````

Прибегнув к уже рассмотренным механизмам можно с легкостью типизировать столь сложный на первый взгляд случай.

`````ts
type A = readonly unknown[];
type Carry<T extends A, U extends A, R> = (...restParams: [...T, ...U]) => R;

function carry<T extends A, U extends A, R>(f: Carry<T, U, R>, ...initialParams: T){
    return function (...restParams: U){
        return f(...initialParams, ...restParams);
    }
}


// использование

const f = (a: number, b: string, c: boolean) => {};

const f0 = carry(f, 5, ''); // Ok
const f1 = carry(f, 5, '', true); // Ok
const f2 = carry(f, 5, '', ''); // Error -> Argument of type '""' is not assignable to parameter of type 'boolean'.
const f3 = carry(f, 5, '', true, 5); // Error -> Expected 4 arguments, but got 5.

f0(true); // Ok
f0(1); // Error -> Argument of type '1' is not assignable to parameter of type 'boolean'.
`````


И напоследок стоит отметить, что сложно переоценить важность добавления вариативных кортежей поскольку этот механизм ляжет в основу усовершенствования стандартной декларации описывающей _JavaScript_ конструкции.
