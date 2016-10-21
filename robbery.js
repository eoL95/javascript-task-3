'use strict';

exports.isStar = true;
var START_OF_WEEK = Date.UTC(2016, 1, 1, 0, 0);
var MINUTES_IN_DAY = 24 * 60;
var END_OF_WEDNESDAY = 24 * 60 * 3;
var DAYS = {
    'ПН': 1,
    'ВТ': 2,
    'СР': 3,
    'ЧТ': 4,
    'ПТ': 5,
    'СБ': 6,
    'ВС': 7
};

/**
 * Для вывода времени, если часы или минуты меньше 10
 * @param {Integer} time
 * @returns {String}
 */
function showTime(time) {
    if (time < 10) {
        return '0' + time.toString();
    }

    return time.toString();
}

function toMinutes(utcDate) {

    return utcDate / (1000 * 60);
}

function makeDate(reseivedDate) {

    return Date.UTC(2016, 1, reseivedDate.day, reseivedDate.hours, reseivedDate.minutes);
}

/**
 * @param {String} time
 * @returns {Integer} Сдвиг времени
 */
function getUtc(time) {

    return Number(time[time.match(/\+\d/).index + 1]);
}

/**
 * @param {String} time
 * @returns {Integer} Номер дня недели в строке
 */
function parseDay(time) {
    var dayIndex;
    var keys = Object.keys(DAYS);
    for (var i = 0; i < keys.length; i++) {
        if (time.indexOf(keys[i]) !== -1) {
            dayIndex = time.indexOf(keys[i]);
        }
    }
    if (isNaN(dayIndex)) {
        return 1;
    }

    return DAYS[time[dayIndex] + time[dayIndex + 1]];
}

/**
* @param {String} time - Строка в которой написано время
* @param {Integer} utc - Временная зона банка
* @returns {Object} {day, hours, minutes}
*/
function getDate(time, utc) {
    var shift = getUtc(time);
    var hours = Number(time.match(/\d\d:\d\d/)[0].split(':')[0]);
    var minutes = Number(time.match(/\d\d:\d\d/)[0].split(':')[1]);
    var day = parseDay(time);
    hours = hours - shift + utc;
    if (hours > 23) {
        hours = hours - 24;
        day = day + 1;
    }
    if (hours < 0) {
        hours = hours + 24;
        day = day - 1;
    }

    return {
        'day': day,
        'hours': hours,
        'minutes': minutes
    };
}

/**
* @param {String} time - Строка в которой написано время
* @param {Integer} utc - Временная зона банка
* @returns {Integer} Сколько минут прошло с начала недели
*/
function minutesPassed(time, utc) {

    return toMinutes(makeDate(getDate(time, utc)) - START_OF_WEEK);
}

/**
* Занятые минуты грабителя записывает нулями
* @param {Array} robberSchedule - массив объектов(Записано расписание для конкретного вора)
* @param {Array} busyTime - Изменяемый массив
* @param {Integer} utc - Временная зона банка
*/
function doBusy(robberSchedule, busyTime, utc) {
    for (var i = 0; i < robberSchedule.length; i++) {
        for (var j = minutesPassed(robberSchedule[i].from, utc);
            j < Math.min(minutesPassed(robberSchedule[i].to, utc), END_OF_WEDNESDAY);
            j++) {
            busyTime[j] = 0;
        }
    }
}

/**
Зануляет минуты когда банк закрыт
* @param {Array} workingHours - Время работы банка
* @param {Array} busyTime - Изменяемый массив
* @param {Integer} utc - Временная зона банка
*/
function doClose(workingHours, busyTime, utc) {
    var i = 0;
    for (i = 0; i < minutesPassed(workingHours.from, utc); i++) {
        busyTime[i] = 0;
        busyTime[i + MINUTES_IN_DAY] = 0;
        busyTime[i + MINUTES_IN_DAY * 2] = 0;
    }
    for (i = minutesPassed(workingHours.to, utc); i < MINUTES_IN_DAY; i++) {
        busyTime[i] = 0;
        busyTime[i + MINUTES_IN_DAY] = 0;
        busyTime[i + MINUTES_IN_DAY * 2] = 0;
    }
}

/**
* Находит минуты с которых возможно ограбить банк
* @param {Array} busyTime - массив занятости
* @param {Integer} duration - длительность ограбления
* @returns {Array} startMinutes
*/
function search(busyTime, duration) {
    var startMinutes = [];
    var count = 0;
    for (var i = 0; i < busyTime.length; i++) {
        if (busyTime[i] === 1) {
            count = count + 1;
        } else {
            count = 0;
        }
        if (count === duration) {
            startMinutes.push(i - count);
            i = i - count + 1;
            count = 0;
        }
    }

    return startMinutes;
}

/**
 * @param {Object} schedule – Расписание Банды
 * @param {Number} duration - Время на ограбление в минутах
 * @param {Object} workingHours – Время работы банка
 * @param {String} workingHours.from – Время открытия, например, "10:00+5"
 * @param {String} workingHours.to – Время закрытия, например, "18:00+5"
 * @returns {Object}
 */
exports.getAppropriateMoment = function (schedule, duration, workingHours) {
    console.info(schedule, duration, workingHours);
    var utc = getUtc(workingHours.from);
    var lastTry = 0;

    /**
      Создаем массив из 24*60*3 чисел.
      Цифра 0 в индексе i означает, что в минуту i грабитель занят.
      Изначально заполняем массив единицами. Затем интервалы, когда первый
      грабитель занят заменяем на нули. То же проделываем со вторым и третьим.
      Затем минуты, когда банк закрыт также зануляем.
      В итоге получим массив, где 1 будут означать минуты, когда возможен
      грабеж.
     */
    var busyTime = [];
    for (var i = 0; i < END_OF_WEDNESDAY; i++) {
        busyTime.push(1);
    }
    doBusy(schedule.Danny, busyTime, utc);
    doBusy(schedule.Linus, busyTime, utc);
    doBusy(schedule.Rusty, busyTime, utc);
    doClose(workingHours, busyTime, utc);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            if (search(busyTime, duration).length !== 0) {
                return true;
            }

            return false;
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (search(busyTime, duration).length === 0) {

                return '';
            }
            var rightTime = search(busyTime, duration)[lastTry] + 1;
            var day = Math.floor(rightTime / (MINUTES_IN_DAY));
            var hours = Math.floor((rightTime - MINUTES_IN_DAY * day) / 60);
            var minutes = (rightTime - MINUTES_IN_DAY * day) % 60;

            return template
                .replace('%DD', ['ПН', 'ВТ', 'СР'][day])
                .replace('%HH', showTime(hours))
                .replace('%MM', showTime(minutes));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var flag = 0;
            var tries = search(busyTime, duration);
            for (var j = lastTry; j < tries.length; j++) {
                if (tries[j] - tries[lastTry] > 29) {
                    lastTry = j;
                    flag = 1;
                    break;
                }
            }
            if (flag === 0) {
                return false;
            }

            return true;
        }
    };
};
