# Типизированные хуки

_React_ _api_ насчитывает десять предопределенных хуков большинство которых являются универсальными. Каждый из них будет рассмотрен по отдельности. Кроме того, данная глава будет посвящена определению пользовательских хуков с учетом последних возможностей _TypeScript_.


## Предопределенные хуки - useState<T>()

Рассмотрение данной темы стоит начать с самого часто применяемого универсального хука `useState<T>(initialState): [state, dispatch]` параметр типа которого представляет определяемое им состояние. В случаях когда при вызове универсальной функции `useState<T>(initialState)` аргумент типа не устанавливается, тип значения будет выведен на основе аргумента функции обозначаемого `initialState`. Это в свою очередь означает, что при отсутствии инициализационного значения (вызов функции `useState` без значения) или его временном замещении значением принадлежащим к другому типу (например объектный тип замещается значением `null`), или частичном значении (объектный тип определяющий лишь часть своих членов), изменить его в будущем с помощью функции обозначаемой `dispatch` будет невозможно, поскольку она при определении также ассоциируется с выведенным на основе `initialState` типом.

`````ts
const A: FC = () => {
                              /**[0][1] */
    let [state, dispatch] = useState();
    dispatch(0); // Error -> type 0 is not type undefined

    /**
     * Поскольку отсутствие initialState [1] не было
     * компенсировано аргументом типа [0] невозможно
     * установит новое значение с помощью функции dispatch
     * если оно принадлежит к типу отличному от выведенного
     * в момент определения.
     */


    return null;
}

const B: FC = () => {
                               /**[0][1] */
    let [state, dispatch] = useState(null);
    dispatch({ a: 0 }); // Error -> type {a: number} is not type null

    /**
    * Поскольку initialState [1] принадлежит к типу null
    * и отсутствует уточнение типа состояния при помощи
    * аргумента типа [0], то будет невозможно установить новое
    * значение с помощью функции dispatch если оно принадлежит
    * к типу отличному от выведенного в момент определения.
    */


    return null;
}
const С: FC = () => {
                               /**[0] [1] */
    let [state, dispatch] = useState({a: 0});
    dispatch({ a: 0, b: `` }); // Error -> type {a: number, b: string} is not type {a: number}

    /**
    * Поскольку initialState [1] представляет из себя лишь 
    * часть от предполагаемого типа и при этом отсутствует
    * уточнение типа состояния при помощи
    * аргумента типа [0], то будет невозможно установить новое
    * значение с помощью функции dispatch если оно принадлежит
    * к типу отличному от выведенного в момент определения.
    */


    return null;
}
`````

В подобных случаях необходимо уточнить тип к которому принадлежит состояние при помощи аргумента типа. Единственное нужно помнить, что несмотря на уточнение типа, при отсутствии `initialState`, состояние будет принадлежать к объединению `T | undefined`.


`````ts
const A: FC = () => {
    let [state, dispatch] = useState<number>();
    dispatch(0); // Ok
    state; // number | undefined


    return null;
}

const B: FC = () => {
                                              /**[*] */
    let [state, dispatch] = useState<{a: number} | null>(null);
    dispatch({ a: 0 }); // Ok
    state; // {a: number} | null


    return null;
}
const С: FC = () => {
                                             /**[*] */
    let [state, dispatch] = useState<{a: number; b?: string;}>({a: 0});
    dispatch({ a: 0, b: `` }); // Ok
    state; // {a: number; b?: string | undefined}


    return null;
}

/**
 * [*] конкретизация типа
 */
 `````

Все описанные случаи так или иначе предполагают дополнительные проверки на существование значения, которые на практике отягощают код. Поэтому при отсутствии конкретного состояния выступающего в роли аргумента универсальной функции, всегда лучше устанавливать значение по умолчанию в полной мере соответствующего типу, нежели допускать его отсутствие, замещение или частичную установку.

При условии, что `initialState` представлен значением в полной мере соответствующим требуемому типу, необходимость в уточнении с помощью аргумента типа пропадает, поскольку выводу типов не составит особого труда справиться самостоятельно. Простыми словами, если аргумент типа не устанавливается, его тип выводится на основе типа к которому принадлежит аргумент вызываемой функции. В случае, когда состояние в полной мере устанавливается в качестве единственного аргумента хука `useState<T>()` необходимости в уточнении типа, при помощи аргумента функционального типа, не требуется. Если в качестве значения выступает примитив или объект, все члены которого инициализированны, вывод типов будет только рад взять работу по установлению типа на себя.

`````ts
const A: FC = () => {
    let [state, dispatch] = useState(0);
    dispatch(0); // Ok
    state; // number


    return null;
}

const B: FC = () => {
    let [state, dispatch] = useState({a: 0});
    dispatch({ a: 0 }); // Ok
    state; // {a: number}


    return null;
}
const С: FC = () => {
    let [state, dispatch] = useState({a: 0, b: ``});
    dispatch({ a: 0, b: `` }); // Ok
    state; // {a: number; b: string;}


    return null;
}
`````

## Предопределенные хуки - useEffect() и useLayoutEffect()

Следующими на очереди расположились сразу два идентичных с точки зрения типизации хука `useEffect(effect, deps?): void` и `useLayoutEffect(effect, deps?): void`, ожидающие в качестве первого параметра функцию, а в качестве второго необязательного параметра, массив, изменение элементов которого приводит к повторному вызову первого аргумента. Поскольку у данных хуков отсутствует возвращаемое значение, сложно представить сценарий в котором возникает ошибка связанная с передачей аргументов. Поэтому подробное рассмотрение и пояснение будет опущено.

`````ts
const A: FC = () => {
    useEffect(() => {
        return () => {}
    }, []);

    useLayoutEffect(() => {
        return () => {}
    }, []);


    return null;
}
`````

## Предопределенные хуки - useContext<T>()

Следующий претендент на рассмотрение предназначен для работы с контекстом и является универсальной функцией `useContext<T>(context)` принимающей в качестве аргумента объект контекста, который при необходимости можно уточнить с помощью аргумента типа. Поскольку вывод типов в состоянии самостоятельно вывести тип опираясь на обязательный параметр `context`, то уточнение типа с помощью аргумента типа не требуется.


`````ts
import React, {createContext, useContext, FC} from "react";

const StringContext = createContext(`Is Context Value!`);

const A: FC = () => {
    let context = useContext(StringContext // let context: string


    return null;
}
`````
Уточнение с помощью аргумента типа может потребоваться только при необходимости приведения более общего типа к более конкретному. Но в реальности универсальная функция этого не позволяет сделать.

`````ts
import React, {createContext, useContext, FC} from "react";

interface T0 {
    a: number;
}
interface T1 {
    b: string;
}


       /**[0] */
interface T2 extends T0, T1 {}

/**
 * [0] более общий тип
 */


let contextDefaultValue: T2 = {
    a: 0,
    b: ``
};

const StringContext = createContext(contextDefaultValue); // const StringContext: React.Context<T2>

const A: FC = () => {
    let c0 = useContext(StringContext); // let c0: T2
    let c1 = useContext<T0>(StringContext); // Error -> [1]

    /**
     * [1] при попытке приведения более общего типа
     * T2 к более конкретному типу T0 возникает ошибка ->
     * Argument of type 'Context<T2>' is not assignable
     * to parameter of type 'Context<T0>'.
     */

    return null;
}
`````

При возникновении потребности в подобном приведении конкретизировать необходимо идентификатор ассоциированный со значением, то есть переменную.

`````ts
const A: FC = () => {
    let c2: T0 = useContext(StringContext); // Ok -> let c2: T0

    return null;
}
`````

## Предопределенные хуки - useReducer<R>()

Следующий в списке предопределенных хуков расположился `useReducer<R>(reducer, initialState, stateInit):[state, dispatch]` представленный универсальной функцией имеющей множество перегрузок. Чтобы познакомится с каждым из параметров данной функции, для начала, нам потребуется объявить два типа описывающих состояние (`state`) и инициализационное состояние (`initialState`), которое специально будет отличаться от обычного, что бы преобразовать его при помощи функции обозначенной как `stateInit`.

`````ts
/**[0] */
interface InitialState {
    name: string;
    age: number;
    gender: `male` | `female` | `notSpecified`;
}
/**[1] */
interface State {
    name: string;
    gender: `male` | `female` | `notSpecified`;
}

/**
 * Объявление интерфейсов описывающих
 * состояние [1] и инициализационное состояние [0].
 * 
 */
 `````

Затем определим функцию `reducer` для описания сигнатуры которой воспользуемся импортированным их пространства имен _React_ обобщенным типом `Reducer<S, A>` ожидающего в качестве первого аргумента типа тип описывающий `state`, а в качестве второго тип описывающий действие `Action`. В нашем примере второй аргумент типа `Reducer<S, A>` будет представлен псевдонимом для двух конкретных типов действий, перед объявлением которых стоит обратить внимание на один относящийся к ним тонкий момент. Тонкость заключается в том, что функция-редюсер, в качестве второго параметра, может, и в большинстве случаев будет принимать объекты действий принадлежащих к разным типам. Для их конкретизации выводу типов потребуется помощь в виде дискриминантных полей.

`````ts
import React, {useReducer, Reducer, FC} from "react";

interface InitialState {
    name: string;
    gender: number;
    gender: `male` | `female` | `notSpecified`;
}
interface State {
    name: string;
    gender: `male` | `female` | `notSpecified`;
}


/**[0] */
enum ActionType {
    Name = `name`,
    Gender = `gender`,
}

/**
 * [0] определение перечисления содержащего
 * константы необходимые для конкретизации типа
 * Action.
 */


            /**[1] */
interface NameAction {
    type: ActionType.Name; /**[2] */
    name: string; /**[3] */
}
            /**[1] */
interface GenderAction {
    type: ActionType.Gender; /**[2] */
    gender: `male` | `female` | `notSpecified`; /**[3] */
}

/**
 * [1] объявление более конкретных типов действий
 * объявляющий поля name и gender [3] и дискриминантное
 * поле type [2] в качестве типа которого указан элемент
 * перечисления.
 */


/**[4] */
type Actions = NameAction | GenderAction;

/**
 * [4] объявление псевдонима ссылающегося на
 * тип объединение представленный типами Action.
 */


     /**[5]      [6]    [7]     [8]            [9]     [10] */
const reducer: Reducer<State, Actions> = (state, action) => {
                /**[11] */
    if(action.type === ActionType.Name){
                                /**[12] */
        return {...state, name: action.name};
                      /**[11] */
    }else if(action.type === ActionType.Gender){
                                /**[12] */
        return {...state, gender: action.gender};
    }


    return state;
}

/**
 * [5] определение функции редюсера сигнатура
 * которой уточняется при помощи импортированного
 * из пространства имен React обобщенного типа Reducer<S, A> [6]
 * в качестве первого параметра который получает тип представляющей
 * State [7], а в качестве второго тип объединение Actions [8].
 * При таком сценарии сигнатура функции в явном указании типов не нуждается [9] [10]
 * 
 * Блок кода, вхождение в который возможно в результате положительного
 * результата выполнения условия на принадлежность дискриминантного поля type
 * элементу перечисления [11], подразумевает, что объект action принадлежит
 * к соответствующему типу, что позволяет обращаться к присущим только ему членам [12]
 * 
 */
`````

Как было сказано ранее, сигнатура редюсера не нуждается в аннотации если его тип конкретизирован с помощью `Reducer<S, A>`. За этим скрывается один коварный момент. Представьте ситуацию при которой некоторое время приложение работало с состоянием определяющим `name`, а затем было принято решение изменить его на `fullName`.

`````ts
// было

interface State {
    name: string;
    age: number;
}

interface NameAction {
    type: `name`;
    name: string;
}

const reducer: Reducer<State, NameAction> = (state, action) => {
    if(action.type === `name`){
        return {...state, name: action.name};
    }
    
    return state;
}
`````

После того как тип описывающий состояние и действие претерпят изменения, неминуемо возникнет ошибка указывающая, что в действии больше нет поля `name`. Если впопыхах изменить лишь старый идентификатор `name` на новый `fullName`, то можно не заметить как значение ассоциированное с новым идентификатором определенным в объекте действия присваивается старому идентификатору определяемому в объекте нового состояния. К ошибке это не приведет, поскольку механизм распространения старого состояния `...state` наделяет новое всеми признаками необходимыми для совместимости с типом `State`. Старый идентификатор `name` в новом состоянии делает его принадлежащим к более общему типу который совместим с объектом `State`. Это неминуемо приводит к трудновыявляемому багу, поскольку значение поля `fullName` всегда будет старым.

`````ts
interface State {
    fullName: string; /**[0] */
    age: number;
}

interface NameAction {
    type: `name`;
    fullName: string; /**[0] */
}

const reducer: Reducer<State, NameAction> = (state, action) => {
    if(action.type === `name`){
                        /**[1]        [2] */
        return {...state, name: action.fullName};
    }

    return state;
}

/**
 * При изменении State и NameAction [0] ошибка
 * укажет на отсутствие поля name  в объекте
 * принадлежащего к типу NameAction [2]. Интуитивное
 * исправление лишь этой ошибки приведет к трудновыявляемому
 * багу, поскольку новое поле действия присваивается старому идентификатору [1].
 * Нужно быть внимательным, поскольку ошибки не возникнет. Причина заключается в том
 *, что распространение старой версии ...state наделяет новый объект всеми необходимыми
 * характеристиками, что бы быть совместимым с типом State. Старое поле делает из нового объекта
 * значение принадлежащие к более общему типу который совместим с типом State. Поэтому
 * ошибки связанной с неверным возвращающимся значением не возникает. Тем не менее редюсер
 * никогда не изменит значение на новое. Оно всегда будет браться из предыдущего объекта состояния.
 */
`````

Возвращаясь к основному примеру осталось определить компонент в котором и будет происходить определение элементов _Redux_. Первым делом в теле компонента определим инициализационное состояние которое с помощью функции обозначенной ранее как `stateInit` будет преобразовано в значение соответствующее типу необходимого редюсеру. Стоит заметить, что поскольку инициализационное значение в полной мере соответствует типу `InitialState` аннотация типа является излишней. При определении с помощью универсальной функции `useReducer()` элементов редакса стоит сделать акцент на отсутствии необходимости в указании аргументов типа, поскольку вывод типов будет опираться на аннотации типов параметров данного хука.

Осталось последовательно изменить состояние с помощью функции `dispatch` вызов которой с объектами в точносте соответствующих типам `*Action` не вызывает никаких нареканий. Вызов с аргументом не надлежащего типа приводит к возникновению ошибки, что в свою очередь подтверждает надежность описанной логики сопряженной с хуком `useReducer()`.


`````ts
        /**[13]               [14] */
const initState = (initialState: InitialState) => {
    let {gender, ...reducerState} = initialState;

    return reducerState; /**[15] */
};

const A: FC = () => {
        /** [16]       [17] */
    let initialState: InitialState = {
        name: `noname`,
        age: NaN,
        gender:  `notSpecified`
    };
                        /**[18] */
    let [state, dispatch] = useReducer(reducer, initialState, initState);

    /**[19] */
    dispatch({
        type: ActionType.Name,
        name: `superuser`
    });

    /**[19] */
    dispatch({
        type: ActionType.Gender,
        gender: `male`
    });

    /**[20] */
    dispatch({
        type: ActionType.Gender,
        gender: `male`,
        age: 100
    }); // Error -> Object literal may only specify known properties, and 'age' does not exist in type 'GenderAction'.


    return null;
}

/**
 * [14] определение инициализационного состояния которое будет
 * передано в качестве единственного аргумента [14] функции initState [13]
 * предназначенной для его трансформации в состояние пригодное редюсеру [15].
 * Данная функция вместе с редюсером и инициализационным состоянием передается
 * в универсальную функцию useReducer в качестве аргументов. Стоит заметить, что 
 * универсальная функция useReducer определяющая элементы redux [18] 
 * в указании аргументов типа не нуждается так как вывод типов отталкивается от
 * типов указанных в аннотациях элементов ожидаемых в качестве параметров.
 * 
 * [19] успешное изменение состояния.
 * [20] попытка изменить состояние с помощью объекта тип которого не совместим
 * с типом State приводит к ошибке.
 */
`````

Не будет лишним пролить свет на подход объявления типов действий в основе которых лежит базовый тип. Подобное часто требуется для так называемых `DataAction`, действий которые помимо поля `type` определяют ещё и поле `data` с типом `T`.

Для этого потребуется объявить два обобщенных типа. Первым объявим обобщенный тип `Action<T>`, единственный параметр типа которого будет указан в аннотации типа дискриминантного поля `type`. Вторым тип `DataAction<T, D>`, первый параметр типа которого будет передан при расширении в качестве аргумента типу `Action<T>`, а второй параметр типа будет указан в аннотации типа единственного поля `data`. Такой подход часто применяется на практике и значительно упрощает объявление типов представляющих действия предназначенных исключительно для транспортировки данных.

`````ts
/**[0] */
interface Action<T> {
    type: T;
}
/**[1] */
interface DataAction<T, D> extends Action<T> {
    readonly data: D;
}

/**
 * Объявление обобщенных типов действий первый из которых
 * описывает обычное действие с единственным полем
 * type: T [0], а другой расширяет первый и определяет
 * поле data: D.
 */



enum ActionType {
    Name = `name`,
    Gender = `gender`,
}


interface NameData {
    name: string;
}
interface GenderData {
    gender: `male` | `female` | `notSpecified`;
}


          /**[2]                [3]            [4]          [5] */
interface NameAction extends DataAction<ActionType.Name, NameData> {
}
          /**[2]                [3]            [4]               [5] */
interface GenderAction extends DataAction<ActionType.Gender, GenderData> {
}

/**
 * [2] определение конкретных действий в основе
 * которых лежит базовый обобщенный тип DataAction<T, D> [3]
 * которому при расширении в качестве первого аргумента типа
 * устанавливается тип дискриминантного поля [4], а в качестве
 * второго тип представляющий данные [5].
 */

type Actions = NameAction | GenderAction;
`````

Осталось рассмотреть только случай предполагающий указания аргументов типа универсальной функции острая необходимость в которых возникнет при определении аргументов в момент вызова. В таком случае в качестве первого аргумента типа универсальная функция ожидает тип описывающий функцию редюсер, вторым инициализационное состояние. Кроме того, прибегнуть к помощи аргументов типа может потребоваться и при других сценариях рассматриваемых на всем протяжении темы посвященной хукам. Также не стоит забывать, что универсальная функция `useReducer` имеет множество перегрузок, что на практике допускает сценарии отличные от данного примера.

`````ts
import React, {useReducer, Reducer, FC, useRef} from "react";

interface InitialState {
    name: string;
    age: number;
    gender: `male` | `female` | `notSpecified`;
}
interface State {
    name: string;
    gender: `male` | `female` | `notSpecified`;
}


enum ActionType {
    Name = `name`,
    Gender = `gender`,
}

enum Genders {
    Male = `male`,
    Female = `female`,
    NotSpecified = `notSpecified`
}


interface NameAction {
    type: ActionType.Name;
    name: string;
}
interface GenderAction {
    type: ActionType.Gender;
    gender: Genders;
}


type Actions = NameAction | GenderAction;

const App: FC = () => {
                                            /**[0]                  [1] */
    let [state, dispatch] = useReducer<Reducer<State, Actions>, InitialState>(
        (state, action) => state, /**[2] */
        {name: ``, age: 0, gender: Genders.NotSpecified}, /**[3] */
        (initialState) => ({name: initialState.name, gender: initialState.gender})
    );

    return null;
}

/**
 * Указание аргументов типа универсальной функции
 * требуется тогда, когда её аргументы определяются
 * при вызове. В таком случае первый аргумент типа
 * будет представлять описание [0] функции редюсера [02],
 * второй инициализационного состояния [1] [3]. Также возможны
 * и другие сценарии требующий указания аргументов типа которые 
 * были затронуты ранее в теме. Кроме того, универсальная функция
 * имеет множество перегрузок допускающих отличие от данного примера. 
 */
 `````

## Предопределенные хуки - useCallback<T>()

Следующий на очереди универсальный хук `useCallback<T>(callback: T, deps): T` рассмотрение которого можно ограничить иллюстрацией его применения, поскольку с ним не связанно ничего, что к данному моменту могло бы вызвать хоть какой-то вопрос. Другими словами, как и в остальных рассмотренных ранее случаях прибегать к помощи аргументов типа следует только тогда, когда сигнатура функции обозначенной как `callback` частично или вовсе не имеет указания типов.

`````ts
import React, {useCallback, FC} from "react";


const A: FC = () => {
    /**[0] */
    const greeter = useCallback((userName: string) => {
        return `Hello ${userName}!`;
    }, []);

    /**
     * [0] вывод типов ->
     * 
     * const greeter: (userName: string) => string
     */


    return null;
}



type Decorate = (username: string) => string;

const B: FC = () => {
    /**[0] */
    const greeter = useCallback<Decorate>( userName => {
        return `Hello ${userName}!`;
    }, []);

    /**
     * [0] аргумент типа ->
     * 
     * const greeter: Decorate
     */


    return null;
}
`````

## Предопределенные хуки - useRef<T>()

Следующий хук `useRef<T>(initialValue)` является универсальной функцией предназначенной для создания объекта рефы. Поскольку объект рефы возвращаемый из данного хука может служить не только для хранения ссылок на _React элементы_ и _React компоненты_, но и на любые другие значения, которые к тому же могут выступать в качестве единственного аргумента, данная функция имеет множество перегрузок. И кроме этого на текущий момент с ней связан один нюанс. Но обо всем по порядку.

В тех случаях когда объект рефы выполняет роль хранилища для не относящихся к _React_ значений, в его определении нет ничего необычного. Простыми словами, если инициализационное значение устанавливается частично или не устанавливается вовсе, то его тип необходимо конкретизировать с помощью аргумента типа. В противном случае переложить эту работу на вывод типов.

`````ts
import React, {useRef, FC} from "react";

interface Data {
    a: number;
    b: string;
}

const A: FC = () => {
                        /**[0]   [1]      [2] */
    let dataRef = useRef<Partial<Data>>({a: 0}); // let dataRef: React.MutableRefObject<Partial<Data>>
    let a = dataRef.current.a; // let a: number | undefined

    return null;
}

/**
 * Поскольку значение [1] установлено частично [2]
 * возникла необходимость прибегнуть к помощи типа
 * Partial<T> [0].
 */

const B: FC = () => {
                            /**[0]        [1] */
    let dataRef = useRef<Data | undefined>(); // let dataRef: React.MutableRefObject<Data | undefined>
    let a = dataRef.current?.a; // let a: number | undefined

    return null;
}

/**
 * Поскольку значение [1] вовсе не было установлено
 * аргумент типа указан как объединение включающего
 * тип undefined [0].
 */

const C: FC = () => {
           /**[0]      [1]   [2] */
    let dataRef = useRef({a: 0, b: ``}); // let dataRef: React.MutableRefObject<{a: number;b: string;}>
    let a = dataRef.current.a; // let a: number

    return null;
}

/**
 * Поскольку значение [2] в полной мере соответствует
 * предполагаемому типу необходимости в конкретизации
 * типа отпадает [0] [1].
 */
 `````

Также стоит обратить внимание, что идентификатор которому в момент определения присваивается результат вызова функции `useRef()` в явной аннотации не нуждается.

`````ts
const C: FC = () => {
        /**[0] */
    let dataRef = useRef({a: 0, b: ``});

    return null;
}

/**
 * [0] ссылка на возвращаемый хуком useRef объект
 * в аннотации типа не нуждается. Указание аннотаций
 * типа в подобных случаях лишь отнимают время и
 * затрудняют чтение кода.
 * 
 * let dataRef: React.MutableRefObject<{a: number;b: string;}>
 */
`````

Осталось оговорить упомянутый в самом начале нюанс который связан с объектом рефы устанавливаемого _React элементу_. Дело в том, что декларация _React элементов_, в частности поля `ref`, аннотирована устаревшим типом, который не совместим с типом значения получаемого в результате вызова хука `useRef()`. К тому же уточнение типа в аннотации идентификатора или с помощью аргументов типа универсальной функции с данной проблемой справится не помогут. Единственное решение явное приведение к типу `RefObject<T>` возвращаемое хуком значение с помощью оператора `as`.
 
`````ts
import React, {useRef, FC, RefObject} from "react";

const A: FC = () => {
    // let formRef: RefObject<HTMLFormElement> | null = useRef(); // Error
    // let formRef = useRef<RefObject<HTMLFormElement> | null>(); // Error
    let formRef = useRef() as RefObject<HTMLFormElement> | null; // Ok


    return <form ref={formRef}></form>
}
`````

Более подробно с данным хуком можно познакомиться в главе посвященной рефам.


## Предопределенные хуки - useImperativeHandle<T, R>()

Следующий на очереди хук `useImperativeHandle<T, R>(ref: Ref<T>, apiFactory() => R): void` предназначенный для присваивания объекта выступающего в роли открытой части _api_ функционального компонента. В тех случаях когда открытая часть _api_ отличается от закрытой, универсальная функция нуждается в уточнении при помощи аргументов типа. В остальных случах всегда рекомендуется поручить эту работу выводу типов. 


`````ts
import React, {ForwardRefRenderFunction, RefObject, useRef, useImperativeHandle, FC, forwardRef} from "react";

interface FormProps {

}

/**[0] */
interface PublicFormApi {
    a: () => void;
}
/**[1] */
interface PrivateFormApi extends PublicFormApi {
    b: () => void;
}

/**
 * [0] объявление типа представляющего открытую часть
 * api компонента, которую будет расширять объявленный
 * позже тип описывающий его закрытую часть [1].
 */


 /**
  * 
  * [!] не обращать внимание на код
  * помеченный восклицательным знаком,
  * поскольку данные участи кода будут
  * подробно рассмотрены в свое время.
  */

                    /**[!] */
const Form: ForwardRefRenderFunction<PublicFormApi, FormProps> = (props, ref) => {
                         /**[2]             [3] */
    useImperativeHandle<PublicFormApi, PrivateFormApi>(ref, () => ({
        a: () => {},
        b: () => {},
    }), []);

    /**
     * С помощью аргументов типа указываем тип
     * открытой [2] и закрытой [3] части api компонента.
     */ 


    return null;
}

        /**[!]            [!] */
const FormWithRef = forwardRef(Form);


const App: FC = () => {
                        /**[!] */
    let formRef = useRef() as RefObject<PublicFormApi>;

    formRef.current?.a(); // Ok
    // formRef.current?.b(); // Error

                     /**[6] */
    return <FormWithRef ref={formRef} />;
}
 `````

## Предопределенные хуки - useMemo<T>()

Следующим на очереди хук `useMemo<T>(factory): T` является универсальной функцией ожидающей в качестве первого параметра фабричную функцию вычисляющую возвращаемое хуком значение тип которого, при необходимости, можно указать с помощью аргумента типа. Второй обязательный параметр принадлежит к типу массива, при наличии и изменении элементов которого происходит повторный вызов фабричной функции. Как всегда, стоит упомянуть, что явное указание аргумента типа универсальной функции необходимо в очень редких случаях, каждый из которых был рассмотрен на протяжении всей темы посвященной хукам. Кроме того, переменная которой присваивается возвращаемое из хука значение, в аннотации типа и вовсе не нуждается.

`````ts
import React, {useMemo, FC} from "react";

const A: FC = () => {
            /**[0]           [1] */
    let memoizedValue = useMemo( () => 2 + 2, [] ); // let memoizedValue: number

    return null;
}

/**
 * Нет необходимости указывать аннотацию
 * типа переменной [0] и передавать аргументы
 * типа [1] универсальной функции поскольку
 * вывод типов самостоятельно справится с этой работой.
 */
 `````

## Предопределенные хуки - useDebugValue<T>()

Следующий и последний на очереди хук `useDebugValue<T>(data: T, format(data: T) => any): void` предназначенный для вывода логов в _devtools_ является универсальной функцией первый параметр которой ожидает выводимое в консоль значение, чьё форматирование может быть осуществлено при помощи функции выступающей в роли второго необязательного параметра. Вся информация имеющаяся к этому моменту и касающаяся явного указания типов в полной мере справедлива и для текущего хука.

 `````ts
import React, {useDebugValue, FC} from "react";

const A: FC = () => {
                    /**[0]    [1]           [2] */
    useDebugValue(new Date(), date => date.getMilliseconds() );

    return null;
}

/**
 * Хук принимает значение тпа Date [0]
 * и затем передает его в функцию форматирования [1]
 * из которой возвращается значение принадлежащее к
 * типу number [2].
 */
`````


## Пользовательский хук

Помимо предопределенных хуков рассмотренных ранее, _React_ также позволяет определять пользовательские хуки, которым будет посвящен остаток текущей главы.

Чтобы стразу перейти к делу представьте, что перед разработчиком встала задача реализовать эффект печатающегося текста с возможностью его запускать, останавливать и ставить на паузу при необходимости. Для этого потребуется реализовать пользовательский хук `usePrintText(text, interval)`, который на вход будет принимать исходный текс и значение скорости печати. Поскольку печатающийся текст будет реализован за счет постепенного изменения состояния определенного внутри хука и выдаваемого наружу, начать стоит именно с описания его типа.

`````ts
/**описание объекта состояния */
interface TextPrintInfo {
    isDone: boolean;
    status: TextPrintStatus;
    currentText: string;
    sourceText: string;
}
`````

Кроме состояния, хук должен предоставлять функции выступающие в роли контролов предназначенных для управления анимацией печатанья. Поэтому вторым шагом потребуется описать тип представляющих контролы, что совершенно не составит никакого труда, так как старт\пауза\стоп являются обычными функциями которые ничего не возвращают.

`````ts
/**описание типа контролов старт\пауза\стоп */
type ControlCallback = () => void;
`````

Осталось описать тип представляющий сам хук или если быть точнее, сигнатуры функции, которой по сути он является. Особое внимание стоит обратить на возвращаемый тип представленный размеченным кортежем, для которого несмотря на большое количество кода не был создан псевдоним. Такое решение было принято из-за того, что автокомплит _ide_ указал бы возвращаемый тип как псевдоним, сделав тем самым подсказку малоинформативной, лишив её информации, доступной благодаря меткам.

`````ts
        /**[0]                                               [1] */
type UsePrintText = (sourceText: string, interval?: number) => [
    textInfo: TextPrintInfo,
    start: ControlCallback,
    pause: ControlCallback,
    stop: ControlCallback
];

/**
 * [0] тип представляющий пользовательский хук,
 * тип возвращаемого значения представлен размеченным кортежем [1]
 */
 `````

 Осталось лишь определить сам хук. 

`````ts
interface TextPrintInfo {
    isDone: boolean;
    status: TextPrintStatus;
    currentText: string;
    sourceText: string;
}

type ControlCallback = () => void;

type UsePrintText = (sourceText: string, interval?: number) => [
    textInfo: TextPrintInfo,
    start: ControlCallback,
    pause: ControlCallback,
    stop: ControlCallback
];



const usePrintText: UsePrintText = (sourceText, interval = 200) => {
    // определение состояния
    let [textInfo, setTextInfo] = useState({
        isDone: false,
        status: TextPrintStatus.Waiting,
        currentText: ``,
        sourceText,
    });


    // определение контролов
    const start = () => {
    }
    const pause = () => {
    }
    const stop = () => {
    }


    return [textInfo, start, pause, stop];
}
`````

Поскольку логика работы хука не имеет никакого отношения к _TypeScript_, её детального разбора не будет. Тем не менее полный код представлен и при желании испытать свои знания, предлагается самостоятельно устно его прокомментировать. 

`````ts
import React, { useState, useEffect } from "react";

enum TextPrintStatus {
    Print = `print`,
    Waiting = `waiting`,
    Pause = `pause`,
    Done = `done`
}

interface TextPrintInfo {
    isDone: boolean;
    status: TextPrintStatus;
    currentText: string;
    sourceText: string;
}

type ControlCallback = () => void;
type UsePrintText = (sourceText: string, interval?: number) => [
    textInfo: TextPrintInfo,
    start: ControlCallback,
    pause: ControlCallback,
    stop: ControlCallback
];

const usePrintText: UsePrintText = (sourceText, interval = 200) => {
    let [timeoutId, setTimeoutId] = useState(NaN);
    let [textInfo, setTextInfo] = useState({
        isDone: false,
        status: TextPrintStatus.Waiting,
        currentText: ``,
        sourceText,
    });


    const isDone = () => textInfo.currentText.length === sourceText.length;
    const getNextText = () => textInfo.currentText.concat(sourceText.charAt(textInfo.currentText.length));

    useEffect(() => {
        if (textInfo.status === TextPrintStatus.Print && !textInfo.isDone) {
            print();
        }

    }, [textInfo]);

    useEffect(() => () => cancel(), []);


    const print = () => {
        let timeoutId = setTimeout(() => {
            setTextInfo({
                status: isDone() ? TextPrintStatus.Done : TextPrintStatus.Print,
                isDone: isDone(),
                currentText: getNextText(),
                sourceText
            });
        }, interval);

        setTimeoutId(timeoutId);
    }

    const cancel = () => {
        if (!Number.isNaN(timeoutId)) {
            clearTimeout(timeoutId);
        }
    }
    const start = () => {
        setTextInfo({
            ...textInfo,
            status: TextPrintStatus.Print,
        });
    }
    const pause = () => {
        cancel();
        setTextInfo({
            ...textInfo,
            status: TextPrintStatus.Pause,
            isDone: false,
        });
        setTimeoutId(NaN);
    }
    const stop = () => {
        cancel();
        setTextInfo({
            isDone: false,
            status: TextPrintStatus.Waiting,
            currentText: ``,
            sourceText
        });
        setTimeoutId(NaN);
    }


    return [textInfo, start, pause, stop];
}



const App = () => {
    let [{currentText}, start, pause, stop] = usePrintText(`React + TypeScript = ♥`);


    return (
        <>
            <p>{currentText}</p>
            <button onClick={() => start()}>start</button>
            <button onClick={() => pause()}>pause</button>
            <button onClick={() => stop()}>stop</button>
        </>
    )
}
`````
