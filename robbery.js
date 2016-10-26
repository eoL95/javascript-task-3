'use strict';

exports.isStar = true;
var START_OF_WEEK = Date.UTC(2016, 1, 1, 0, 0);
var MINUTES_IN_DAY = 24 * 60;
var END_OF_WEDNESDAY = 24 * 60 * 3;
var MS_IN_MINUTE = 1000 * 60;
var DAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

/**
 * Для вывода времени, если часы или минуты меньше 10
 * @param {Integer} count - количество часов или минут
 * @returns {String} Например '01' если задано число 1
 */
function formatTime(count) {
    if (count < 10) {
        return '0' + count.toString();
    }

    return count.toString();
}

/**
 * @param {String} time
 * @returns {Integer} Сдвиг времени
 */
function getTimeZone(time) {
    return Number(time.split('+')[1].slice(-1));
}

/**
 * @param {String} time
 * @returns {Integer} Номер дня недели в строке
 */
function getDay(time) {
    var day = time.split(' ')[0];
    var dayIndex = DAYS.indexOf(day);
    if (dayIndex === -1) {
        return 1;
    }

    return dayIndex + 1;
}

/**
* @param {String} time - Строка в которой написано время
* @param {Integer} bankTimeZone - Временная зона банка
* @returns {Integer} utcDate
*/
function getDate(time, bankTimeZone) {
    var timeZone = getTimeZone(time);
    var parsedTime = time.match(/\d{2}:\d{2}/)[0];
    var hours = Number(parsedTime.split(':')[0]) - timeZone + bankTimeZone;
    var minutes = Number(parsedTime.split(':')[1]);
    var day = getDay(time);

    return Date.UTC(2016, 1, day, hours, minutes);
}

/**
* @param {Integer} utcDate
* @returns {Integer} Количество минут, прошедших с понедельника
*/
function minutesPassed(utcDate) {
    return (utcDate - START_OF_WEEK) / MS_IN_MINUTE;
}

/**
* Занятые минуты грабителя записывает нулями
* @param {Array} robberSchedule - массив объектов(Записано расписание для конкретного вора)
* @param {Array} freeMinutes - Изменяемый массив
* @param {Integer} bankTimeZone - Временная зона банка
*/
function setBusyMinutes(robberSchedule, freeMinutes, bankTimeZone) {
    for (var i = 0; i < robberSchedule.length; i++) {
        var startOfBusy = minutesPassed(getDate(robberSchedule[i].from, bankTimeZone));
        var endOfBusy = Math.min(minutesPassed(getDate(robberSchedule[i].to, bankTimeZone)),
                       END_OF_WEDNESDAY);
        for (var j = startOfBusy; j < endOfBusy; j++) {
            freeMinutes[j] = 0;
        }
    }
}

/**
Зануляет минуты когда банк закрыт. На каждом шаге цикла зануляет минуты
для понедельника, вторника и среды.
* @param {Array} workingHours - Время работы банка
* @param {Array} freeMinutes - Изменяемый массив
* @param {Integer} bankTimeZone - Временная зона банка
*/
function setCloseMinutes(workingHours, freeMinutes, bankTimeZone) {
    for (var i = 0; i < MINUTES_IN_DAY; i++) {
        if (i < minutesPassed(getDate(workingHours.from, bankTimeZone)) ||
            i >= minutesPassed(getDate(workingHours.to, bankTimeZone))) {
            freeMinutes[i] = 0;
            freeMinutes[i + MINUTES_IN_DAY] = 0;
            freeMinutes[i + MINUTES_IN_DAY * 2] = 0;
        }
    }
}

/**
* Находит минуты с которых возможно ограбить банк
* @param {Array} freeMinutes - массив занятости
* @param {Integer} duration - длительность ограбления
* @returns {Array} startMinutes
*/
function findSuccessMinutes(freeMinutes, duration) {
    var startMinutes = [];
    var count = 0;

    for (var i = 0; i < freeMinutes.length; i++) {
        if (freeMinutes[i] === 1) {
            count = count + 1;
        } else {
            count = 0;
        }
        if (count === duration) {
            startMinutes.push(i - count + 1);
            count = count - 1;
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
    var bankTimeZone = getTimeZone(workingHours.from);
    var lastTry = 0;
    var freeMinutes = [];
    for (var i = 0; i < END_OF_WEDNESDAY; i++) {
        freeMinutes.push(1);
    }
    setBusyMinutes(schedule.Danny, freeMinutes, bankTimeZone);
    setBusyMinutes(schedule.Linus, freeMinutes, bankTimeZone);
    setBusyMinutes(schedule.Rusty, freeMinutes, bankTimeZone);
    setCloseMinutes(workingHours, freeMinutes, bankTimeZone);
    var appropriateMinutes = findSuccessMinutes(freeMinutes, duration);

    return {

        /**
         * Найдено ли время
         * @returns {Boolean}
         */
        exists: function () {
            return (appropriateMinutes.length !== 0);
        },

        /**
         * Возвращает отформатированную строку с часами для ограбления
         * Например,
         *   "Начинаем в %HH:%MM (%DD)" -> "Начинаем в 14:59 (СР)"
         * @param {String} template
         * @returns {String}
         */
        format: function (template) {
            if (!this.exists()) {
                return '';
            }
            var day = Math.floor(appropriateMinutes[lastTry] / (MINUTES_IN_DAY));
            var minutesFromMidnight = appropriateMinutes[lastTry] - MINUTES_IN_DAY * day;
            var hours = Math.floor(minutesFromMidnight / 60);
            var minutes = minutesFromMidnight % 60;

            return template
                .replace('%DD', DAYS[day])
                .replace('%HH', formatTime(hours))
                .replace('%MM', formatTime(minutes));
        },

        /**
         * Попробовать найти часы для ограбления позже [*]
         * @star
         * @returns {Boolean}
         */
        tryLater: function () {
            var isTrue = false;
            for (var j = lastTry; j < appropriateMinutes.length; j++) {
                if (appropriateMinutes[j] - appropriateMinutes[lastTry] >= 30) {
                    lastTry = j;
                    isTrue = true;
                    break;
                }
            }

            return isTrue;
        }
    };
};
