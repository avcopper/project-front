$(function() {
    let usersContainer = $('#users');
    loadPage();

    // Изменение количества элементов на странице
    $('#count').on('change', function () {
        $('#pagination a').removeClass('current');
        loadPage();
    });

    // переход по страницам навигации
    $('#pagination').on('click', 'a', function (e) {
        e.preventDefault();
        if (!$(this).hasClass('current')) {
            $('#pagination a').removeClass('current');
            $(this).addClass('current');
            loadPage();
        }
    });

    // редактирование аккаунта
    usersContainer.on('click', '.edit', function (e) {
        e.preventDefault();
        $('#users .save').removeClass('save').addClass('edit');
        $('#users tr td:last-child').addClass('delete');
        $(this).removeClass('edit').addClass('save').parent().find('.delete').removeClass('delete');

        showEditForm($(this).parent());
        hideEditForm($(this).parent());
    });

    // сохранение аккаунта
    usersContainer.on('click', '.save', function (e) {
        e.preventDefault();
        let container = $(this).parent(),
            id = container.find('.id').html(),
            account = {};

        account.name = container.find('.name input').val();
        account.title = container.find('.title input').val();
        account.race = container.find('.race select').val();
        account.profession = container.find('.profession select').val();
        account.banned = container.find('.banned select').val();

        if (checkAccount(account, false)) {
            account.birthday = new Date(account.birthday).getTime();
            updateAccount(account, id);
        }
    });

    // удаление аккаунта
    usersContainer.on('click', '.delete', function (e) {
        e.preventDefault();
        let id = $(this).data('id');
        deleteAccount(id);
    });

    // создание нового аккаунта
    $('#user button').on('click', function (e) {
        e.preventDefault();
        let account = {};
        account.name = $('#name').val();
        account.title = $('#title').val();
        account.race = $('#race').val();
        account.profession = $('#profession').val();
        account.level = $('#level').val();
        account.birthday = $('#birthday').val();
        account.banned = $('#banned').val();

        if (checkAccount(account)) {
            account.birthday = new Date(account.birthday).getTime();
            createAccount(account);
        }
        else showError('Заполните все обязательные поля');
    });
});

/**
 * Показ ошибки
 * @param message - сообщение
 */
function showError(message) {
    $('.error').html(message).show();
}

/**
 * Скрытие блока с ошибкой
 */
function hideError() {
    $('.error').html('').hide();
}

/**
 * Загрузка данных на страницу - пагинация, список аккаунтов
 */
function loadPage() {
    showPagination();
    showAccountList();
}

/**
 * Возвращает номер текущей страницы навигации
 * @returns {number|number}
 */
function getPageNumber() {
    let pageCurrentLink = $('#pagination .current');
    return pageCurrentLink.length !== 0 ? parseInt(pageCurrentLink.html()) - 1 : 0;
}

/**
 * Возвращает количество элементов на странице
 * @returns {number}
 */
function getPageSize() {
    return parseInt($('#count select').val());
}

/**
 * Показывает навигацию на странице
 */
function showPagination() {
    $.ajax({
        method: "GET",
        dataType: 'json',
        url: "/rest/players/count",
        async: false,
        beforeSend: function () {
            hideError();
        },
        success: function(data){//console.log(data);
            if (data > 0) {
                let pageSize = getPageSize(),
                    pageCount = Math.ceil(data / pageSize),
                    pageNumber = getPageNumber() + 1,
                    currentPage = pageNumber > pageCount ? 1 : pageNumber;
                html = '';

                for (let i = 1; i <= pageCount; i++) {
                    html += '        <a href=""' + (i === currentPage ? ' class="current"' : '') + '>' + i + '</a>\n';
                }

                $('#pagination').html(html);
            } else $('#pagination').html('');
        }
    });
}

/**
 * Показывает список аккаунтов
 */
function showAccountList() {
    $.ajax({
        method: "GET",
        dataType: 'json',
        url: "/rest/players",
        async: false,
        beforeSend: function () {
            hideError();
        },
        data: {"pageNumber": getPageNumber(), "pageSize": getPageSize()},
        success: function(data){//console.log(data);
            if (data.length > 0) {
                let html = '';
                for (let i = 0; i < data.length; i++) {
                    let item = data[i],
                        birthdayDate = new Date(item.birthday),
                        date = birthdayDate.getDate(),
                        month = birthdayDate.getMonth() + 1,
                        year = birthdayDate.getFullYear(),
                        fullDate = year + '-' + (month < 10 ? '0' + month : month) + '-' + (date < 10 ? '0' + date : date);

                    html +=
                        '        <tr>\n' +
                        '            <td class="id">'+ item.id +'</td>\n' +
                        '            <td class="name text-left">'+ item.name +'</td>\n' +
                        '            <td class="title text-left">'+ item.title +'</td>\n' +
                        '            <td class="race">'+ item.race +'</td>\n' +
                        '            <td class="profession">'+ item.profession +'</td>\n' +
                        '            <td class="level">'+ item.level +'</td>\n' +
                        '            <td class="birthday">'+ fullDate + '</td>\n' +
                        '            <td class="banned">'+ item.banned +'</td>\n' +
                        '            <td class="edit"></td>\n' +
                        '            <td class="delete" data-id="'+ item.id +'"></td>\n' +
                        '        </tr>';
                }

                $('#users tbody').html(html);
            }
        }
    });
}

/**
 * Показывает форму редактирования аккаунта
 * @param container - родительский контейнер с формой
 */
function showEditForm(container) {
    let account = getAccountInfo(container),
        nameContainer = container.find('.name'),
        titleContainer = container.find('.title'),
        raceContainer = container.find('.race'),
        professionContainer = container.find('.profession'),
        bannedContainer = container.find('.banned');

    nameContainer.html(getNameContainer(account.name));
    titleContainer.html(getTitleContainer(account.title));
    raceContainer.html(getRaceContainer(account.race));
    professionContainer.html(getProfessionContainer(account.profession));
    bannedContainer.html(getBannedContainer(account.banned));
}

/**
 * Возвращает информацию о редактируемом аккаунте
 * @param container - родительский контейнер с формой
 * @returns {{}}
 */
function getAccountInfo(container) {
    let account = {};
    account.name = container.find('.name').html();
    account.title = container.find('.title').html();
    account.race = container.find('.race').html();
    account.profession = container.find('.profession').html();
    account.banned = container.find('.banned').html();
    return account;
}

/**
 * Скрывает форму редактирования аккаунта
 * @param container - родительский контейнер с формой
 */
function hideEditForm(container) {
    $('#users tr').not(container).find('input, select').each(function () {
        let value = $(this).val();
        $(this).parent().html(value);
    });
}

/**
 * Создает аккаунт
 * @param account - аккаунт
 */
function createAccount(account) {
    return updateAccount(account);
}

/**
 * Обновляет аккаунт
 * @param account - аккаунт
 * @param id - id аккаунта
 */
function updateAccount(account, id = null) {
    $.ajax({
        method: "POST",
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        url: "/rest/players" + (id ? '/' + id : ''),
        data: JSON.stringify(account),
        beforeSend: function () {
            hideError();
        },
        success: function(data){//console.log(data);
            clearNewAccountForm();
            loadPage()
        }
    });
}

/**
 * Удаляет аккаунт
 * @param id
 */
function deleteAccount(id) {
    $.ajax({
        method: 'DELETE',
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        url: '/rest/players/' + id,
        beforeSend: function () {
            hideError();
        },
        success: function(data){//console.log(data);
        },
        statusCode:{
            200: function(){
                loadPage();
            },
            404: function(){
                alert('Аккаунт не найден');
            },
        }
    });
}

/**
 * Очищает форму создания нового аккаунта
 */
function clearNewAccountForm() {
    $('#create input').val('');
    $('#create select option').prop('selected', false);
}

/**
 * Проверяет данные сохраняемого аккаунта
 * @param account - аккаунт
 * @param checkAllFields - флаг проверять все поля объекта или нет
 * @returns {boolean}
 */
function checkAccount(account, checkAllFields = true) {
    let races = ['HUMAN', 'DWARF', 'ELF', 'GIANT', 'ORC', 'TROLL', 'HOBBIT'],
        professions = ['WARRIOR', 'ROGUE', 'SORCERER', 'CLERIC', 'PALADIN', 'NAZGUL', 'WARLOCK', 'DRUID'],
        datePattern = /^((19|20)\d\d)-(0?[1-9]|1[012])-(0?[1-9]|[12][0-9]|3[01])$/i;

        if (account.name.length < 1 || account.name.length > 12) return false;
        if (account.title.length < 1 || account.title.length > 30) return false;
        if (account.race.length === 0 || !races.includes(account.race)) return false;
        if (account.profession.length === 0 || !professions.includes(account.profession)) return false;
        if (checkAllFields) {
            if (account.level < 0 || account.level > 100) return false;
            if (account.birthday.length === 0 || !datePattern.test(account.birthday) || new Date(account.birthday).getTime() < 0) return false;
        }

    return true;
}

/**
 * Возвращает поле для редактирования имени
 * @param value - текущее значение
 * @returns {string}
 */
function getNameContainer(value) {
    return '<input type="text" name="name" minlength="1" maxlength="12" value="' + value + '" required>';
}

/**
 * Возвращает поле для редактирования заголовка
 * @param value - текущее значение
 * @returns {string}
 */
function getTitleContainer(value) {
    return '<input type="text" name="title" minlength="1" maxlength="30" value="' + value + '" required>';
}

/**
 * Возвращает список для редактирования расы
 * @param value - текущее значение
 * @returns {string}
 */
function getRaceContainer(value) {
    return '<select name="race" required>\n' +
        '<option value="HUMAN"' + (value === 'HUMAN' ? ' selected' : '') + '>HUMAN</option>\n' +
        '<option value="DWARF"' + (value === 'DWARF' ? ' selected' : '') + '>DWARF</option>\n' +
        '<option value="ELF"' + (value === 'ELF' ? ' selected' : '') + '>ELF</option>\n' +
        '<option value="GIANT"' + (value === 'GIANT' ? ' selected' : '') + '>GIANT</option>\n' +
        '<option value="ORC"' + (value === 'ORC' ? ' selected' : '') + '>ORC</option>\n' +
        '<option value="TROLL"' + (value === 'TROLL' ? ' selected' : '') + '>TROLL</option>\n' +
        '<option value="HOBBIT"' + (value === 'HOBBIT' ? ' selected' : '') + '>HOBBIT</option>\n' +
        '</select>';
}

/**
 * Возвращает список для редактирования профессии
 * @param value - текущее значение
 * @returns {string}
 */
function getProfessionContainer(value) {
    return '<select name="profession" required>\n' +
        '<option value="WARRIOR"' + (value === 'WARRIOR' ? ' selected' : '') + '>WARRIOR</option>\n' +
        '<option value="ROGUE"' + (value === 'ROGUE' ? ' selected' : '') + '>ROGUE</option>\n' +
        '<option value="SORCERER"' + (value === 'SORCERER' ? ' selected' : '') + '>SORCERER</option>\n' +
        '<option value="CLERIC"' + (value === 'CLERIC' ? ' selected' : '') + '>CLERIC</option>\n' +
        '<option value="PALADIN"' + (value === 'PALADIN' ? ' selected' : '') + '>PALADIN</option>\n' +
        '<option value="NAZGUL"' + (value === 'NAZGUL' ? ' selected' : '') + '>NAZGUL</option>\n' +
        '<option value="WARLOCK"' + (value === 'WARLOCK' ? ' selected' : '') + '>WARLOCK</option>\n' +
        '<option value="DRUID"' + (value === 'DRUID' ? ' selected' : '') + '>DRUID</option>\n' +
        '</select>';
}

/**
 * Возвращает список булевых значений
 * @param value - текущее значение
 * @returns {string}
 */
function getBannedContainer(value) {
    return '<select name="banned">\n' +
        '<option value="false"' + (value === 'false' ? ' selected' : '') + '>false</option>\n' +
        '<option value="true"' + (value === 'true' ? ' selected' : '') + '>true</option>\n' +
        '</select>';
}
