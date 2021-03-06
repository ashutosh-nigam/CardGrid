﻿
///<reference path="./Library/jquery.d.ts"/>
///<reference path="./Library/bootstrap.d.ts"/>
///<reference path="./Library/bootpag.d.ts"/>
/*
    Author  : Ashutosh Nigam
    Website : http://www.ashutoshnigam.com
    Email   : ashutosh.nigam@live.com 
*/

/* Button Type */
interface DropDownButton {
    text: string;
    id?: string;
    enable?: boolean;
    hidden?: boolean;
    onClick: (data: any) => void;
}
interface Button {
    text: string;
    className?: string;
    id?: string;
    enable?: boolean;
    hidden?: boolean;
    onClick: (data: any) => void;
    buttons?: Array<DropDownButton>;
}
enum SortDirection {
    asc,
    desc
}
interface SortColumn {
    text: string;
    value: string;
}
interface column {
    id: string;
    hidden?: boolean;
    sortable?: boolean;
    title: string;
    template?: (data: any) => HTMLDivElement;
    width?: number;
}
interface PaginationParams {
    total: number; //Total No of Records Available
    noOfPages: number; // No of Pages
    rows: number; // Size of Page / No of Items per Page
    page: number; // Current Selected Page
    searchParam?: string; // Search Text
    sidx?: string; //Sorting Field
    sord?: string // Sorting Direction
}
// Options type
interface Options {
    url: string; // To Get Data
    type: string; // Get/Post
    data?: any; //Get Data
    pagination?: boolean; // Pagination True/False
    searchBox: boolean; // Show Search Box
    buttons?: Array<Button>; // Buttons to display
    success?: any;
    recordsPerPage?: Array<number>;
    template?: (data: any) => HTMLDivElement;
    cols?: Array<column>;
    currentView?: string; // 'card/table'
    itemsPerRow: number;
    sortCols?: Array<SortColumn>;
    multiSelect?: boolean;
    afterGridRender?: () => void;
    queryParams?: any;
    beforeSend?: any;
    beforeGridLoad?: (data: any) => any;

}
class CardGrid {
    options: Options;
    private selectedDataIds: Array<string>;
    private cardGridId: string;
    private cardRowId: string;
    private searchBoxId: string;
    private sortbyId: string;
    private paginationControlId: string;
    private viewControlId: string;
    private goToPageControlId: string;
    private switchViewControlId: string;
    private pageSizeSelect: string;
    private Pagination: PaginationParams;
    private _allowToSwitchView: boolean = false;
    constructor(_cardGrid: any, options: Options) {
        if (!_cardGrid.hasClass('card-grid')) {
            alert('Please Specify Card-grid class');
            return;
        }
        this.options = $.extend({
            url: '#',
            data: null,
            type: 'GET',
            pagination: true,
            searchBox: true,
            success: null,
            recordsPerPage: [12],
            ItemsPerRow: 4,
            template: null,
            cols: null,
            currentView: 'card',
            sortCols: [{ text: 'Id', value: 'Id' }],
            multiSelect: true,
            queryParams: null,
            beforeSend: null,
            beforeGridLoad: null
        }, options);
        if (window.localStorage.getItem('cardgrid-view')) {
            this.options.currentView = window.localStorage.getItem('cardgrid-view');
        } else {
            window.localStorage.setItem('cardgrid-view', this.options.currentView);
        }
        if (this.options.template && this.options.cols)
            this._allowToSwitchView = true;
        else if (this.options.template == null && this.options.cols != null) {
            this.options.currentView = 'table';
            this._allowToSwitchView = false;
        } else if (this.options.template != null && this.options.cols == null) {
            this.options.currentView = 'card';
            this._allowToSwitchView = false;
        } else {
            alert('Please Define Template for Grid');
            return;
        }


        let Id = '';
        if (_cardGrid.attr('id')) {
            Id = _cardGrid.attr('id');
        }
        else {
            Id = 'cardgrid' + Math.floor((Math.random() * 100) + 1000).toString();
            _cardGrid.attr('id', Id);
        }
        this.cardGridId = Id;
        this.cardRowId = Id + '-card-row';
        this.searchBoxId = Id + '-search-textbox';
        this.sortbyId = Id + '-sort-by';
        this.paginationControlId = Id + '-page-selection';
        this.goToPageControlId = Id + '-go-to-page';
        this.viewControlId = Id + '-view';
        this.switchViewControlId = Id + '-switchView';
        this.pageSizeSelect = Id + '-pageSizeSelect';
        this.selectedDataIds = new Array<string>();
        this.buildGrid();
        this.load();
    }
    getOptions(): Options {
        return this.options;
    }
    getData(): any {
        return this.options.data;
    }
    load() {
        let option = this.options;
        let $this = this;
        if ($.isFunction($.fn.select2)) {
            //$('#' + $this.sortbyId).select2();
            //$('#' + $this.pageSizeSelect).select2({ minimumResultsForSearch: Infinity });
        }
        if (option.beforeSend != null)
            option.beforeSend();
        $.ajax({
            type: option.type,
            url: this.options.url + (this.options.queryParams != null ? '?' + $.param(this.options.queryParams) : ''),
            method: this.options.type,
            data: this.getRequestParams(),
            dataType: "json",
            success: function (responseText, statusText, xhr) {
                if (option.beforeGridLoad != null) {
                    responseText = option.beforeGridLoad(responseText);
                }
                option.data = responseText;

                $this.processData(responseText);
                if (option.success && option.success != undefined && typeof (option.success) === 'function') {
                    option.success();
                }
                $('.dropdown-toggle').dropdown();
                if (option.afterGridRender && option.afterGridRender != undefined && typeof (option.afterGridRender) === 'function') {
                    option.afterGridRender();
                }
            },
            error: function (responseText, statusText, xhr) {
                if (responseText.status === 500 && statusText == 'error') {
                    $.error(responseText.responseText);
                }

            }
        });

        // Request Parameters for Sending Request
    }
    reload(): void {
        this.load();
    }
    // Getting Request Parameters
    private getRequestParams(): PaginationParams {
        let rows = window.localStorage.getItem('cardgrid-stored-per-page') != null ? parseInt(window.localStorage.getItem('cardgrid-stored-per-page')) : this.options.recordsPerPage[0];

        if (!this.Pagination) {
            this.Pagination = {
                total: 0,
                noOfPages: 1,
                rows: rows,
                page: 1,
                searchParam: '',
                sord: 'asc',
                sidx: this.options.sortCols[0].value
            };
        }
        if (this.options.searchBox) {
            this.Pagination.searchParam = (document.getElementById(this.searchBoxId) as HTMLInputElement).value;
        }
        return this.Pagination;
    }
    // Process Data
    private processData(responseData: any): void {
        let $this = this;
        if (responseData == null || responseData == undefined) {
            alert('No Data');
        } else {

            this.Pagination.noOfPages = parseInt((Math.ceil((parseFloat(responseData.total.toString()) / parseFloat(this.Pagination.rows.toString())))).toString());
            this.Pagination.total = responseData.total;
            let ctrl = (document.getElementById($this.goToPageControlId) as HTMLInputElement);
            if (ctrl)
                ctrl.value = this.Pagination.page.toString();
            // this.Pagination.rows = responseData.rows;
            //Create Pagination
            if (jQuery.isFunction($.fn.bootpag)) {
                $('#' + this.paginationControlId).unbind("page").show().bootpag({
                    total: this.Pagination.noOfPages,
                    wrapClass:'pagination ',
                    page: this.Pagination.page,
                    maxVisible: 5,
                    leaps: true,
                    next: 'Next',
                    prev: 'Prev',
                    first: 'First',
                    last: 'Last',
                    firstLastUse: true
                }).on("page", function (event, num) {
                    $this.Pagination.page = num;
                    let goToPage: HTMLInputElement = document.getElementById($this.goToPageControlId) as HTMLInputElement;
                    goToPage.value = num.toString();
                    $this.load();

                });
            } else {
                alert('Please download Bootpag from http://botmonster.com/jquery-bootpag/#.V--5BSh96hc');
                window.open('http://botmonster.com/jquery-bootpag/#.V--5BSh96hc', '_blank')
                return;
            }
            // View Control Building Block
            {
                let currentPage: number = $this.Pagination.page;
                let prevPage: number = currentPage - 1;
                let pageSize: number = $this.Pagination.rows;
                let from = currentPage == 1 ? 1 : prevPage * pageSize + 1;
                let to = currentPage == $this.Pagination.noOfPages ? $this.Pagination.total : currentPage * pageSize;
                let viewtext = "View " + from.toString() + " - " + to.toString() + " of " + $this.Pagination.total.toString();
                let lbl = $('<div/>', { text: viewtext, style: 'height: 34px;padding: 6px 12px;' });
                $('#' + this.viewControlId).empty().append(lbl);
            }
            //Card Grid Building Block


            // building Cards
            this.buildCardTable($this, responseData.Data);

        }
    }

    private buildCardTable($this: CardGrid, data: any) {
        let _cardRow: HTMLDivElement = document.getElementById(this.cardRowId) as HTMLDivElement;
        _cardRow.innerHTML = '';
        if ($this.options.currentView == 'card') {
            $.each(data, function (index, _singleData) {
                let _template: HTMLDivElement = $this.options.template(_singleData);
                let _divContainer = $('<div/>', { 'data-id': _singleData.Id, id: $this.cardGridId + '-data-' + _singleData.Id });
                switch ($this.options.itemsPerRow) {
                    case 2:
                        _divContainer.addClass('col-xs-12 col-sm-6 col-lg-6'); break;
                    case 3:
                        _divContainer.addClass('col-xs-12 col-sm-4 col-lg-4'); break;
                    case 4:
                        _divContainer.addClass('col-xs-12 col-sm-4 col-lg-3'); break;
                    case 6:
                        _divContainer.addClass('col-xs-12 col-sm-3 col-lg-2'); break;
                    case 12:
                        _divContainer.addClass('col-xs-12 col-sm-3 col-lg-1'); break;
                }
                let _thumbnailDiv = $('<div/>', { class: 'thumbnail' });
                // Selected if Previously Selected
                if ($.inArray(_singleData.Id.toString(), $this.selectedDataIds) !== -1) {
                    _thumbnailDiv.attr('selected', 'selected');
                }
                //Selection Block
                _divContainer.unbind('click');
                _divContainer.on('click', function () {
                    let dataId = $(this).attr('data-id');
                    if ($(_thumbnailDiv).attr('selected') == 'selected') {
                        $(_thumbnailDiv).removeAttr('selected');
                        // $(_thumbnailDiv).removeClass('animated fadeOut');

                        let index: number = $this.selectedDataIds.indexOf(dataId);
                        if (index > -1)
                            $this.selectedDataIds.splice(index, 1);
                    }
                    else {
                        if (!$this.options.multiSelect) {
                            $(_cardRow).find('.thumbnail').removeAttr('selected');
                            $this.selectedDataIds.splice(0, $this.selectedDataIds.length);
                        }
                        $(_thumbnailDiv).attr('selected', 'selected');
                        // $(_thumbnailDiv).addClass('animated fadeIn');
                        $this.selectedDataIds.push(dataId);
                    }
                });
                _thumbnailDiv.append(_template).appendTo(_divContainer);
                $(_cardRow).append(_divContainer);
            });
        }
        else {
            let _table = $('<table/>', { class: 'table table-bordered', 'role': 'grid' });
            let _thead = $('<thead/>'); let _thead_tr = $('<tr/>', { role: 'row' });
            let _width_total = 0;
            let _no_of_items = 0;
            $.each($this.options.cols, function (i, o) {
                if (o.width != undefined) {
                    _width_total += o.width;
                    _no_of_items += 1;
                }
            });
            let _width = (100 - _width_total) / ($this.options.cols.length - _no_of_items);
            $.each($this.options.cols, function (idx, col) {
                col = $.extend({
                    sortable: true,
                    hidden: false,
                    template: null,
                    width: _width
                }, col);
                let _th = $('<th/>', { text: col.title, style: 'width:' + col.width + '%', 'colspan': 1, 'rowspan': 1 });
                if (col.hidden) _th.attr('hidden', 'hidden'); else _th.removeAttr('hidden');
                if (col.sortable) _th.addClass('sorting'); else _th.removeClass('sorting');
                _thead_tr.append(_th);
            });
            _thead.append(_thead_tr); _table.append(_thead);
            _table.append(_thead);
            $.each(data, function (idx: number, obj: any) {
                let _tr = $('<tr/>', { 'data-id': obj.Id });
                $.each($this.options.cols, function (i: number, col: column) {
                    let _td = $('<td/>');
                    _td.append(col.template != null ? col.template(obj) : obj[col.id]);
                    if (col.hidden) _td.attr('hidden', 'hidden'); else _td.removeAttr('hidden');
                    _tr.append(_td);
                });
                _tr.unbind('click');
                if ($.inArray(obj.Id.toString(), $this.selectedDataIds) !== -1) {
                    _tr.attr('selected', 'selected');
                }
                _tr.bind('click', function (event) {
                    let dataId = _tr.attr('data-id');
                    if (_tr.attr('selected') == 'selected') {
                        _tr.removeAttr('selected');
                        let index: number = $this.selectedDataIds.indexOf(dataId);
                        if (index > -1)
                            $this.selectedDataIds.splice(index, 1);
                    }
                    else {
                        if (!$this.options.multiSelect) {
                            _table.find('tr').removeAttr('selected');
                            $this.selectedDataIds.splice(0, $this.selectedDataIds.length);
                        }
                        _tr.attr('selected', 'selected');
                        $this.selectedDataIds.push(dataId);
                    }
                });
                _table.append(_tr);
            });
            let _div = $('<div/>', { class: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' });
            _div.append(_table);
            $(_cardRow).append(_div);
        }
    }

    private buildGrid() {
        let _cardgrid = document.getElementById(this.cardGridId);
        $(_cardgrid).append(this.createHeader())
            .append('<div class="clearfix" style="margin-top:20px"></div>')
            .append($('<div/>', { class: 'card-row row', id: this.cardRowId }))
            .append('<div class="clearfix"></div>')
            .append(this.createFooter());
    }
    // Header
    private createHeader(): HTMLDivElement {
        let $this = this;
        let _divHeader = $('<div/>', { class: 'header' });
        let _divRow = $('<div/>', { class: 'row' });
        let _divLeft = $('<div/>', { class: 'col-xs-12 col-lg-3 col-md-4 col-sm-12' });
        let _divMiddle = $('<div/>', { class: 'col-xs-12 col-lg-5 col-md-4 col-sm-12', style: 'text-align:center' });
        let _divRight = $('<div/>', { class: 'col-xs-12 col-lg-4 col-md-4 col-sm-12' });
        // Search Box on Left
        if (this.options.searchBox) {
            let _divSbox = $('<div/>', { style: 'float:left;width:100%' });
            let _tbox = $('<input/>', { type: 'text', class: 'form-control has-feedback-left', id: this.searchBoxId });
            let _span = $('<span/>', { class: 'fa fa-search form-control-feedback left', 'aria-hidden': 'true' });
            _divSbox.append(_tbox).append(_span);
            _divSbox.appendTo(_divLeft);
            $(_tbox).on("keypress", function (e) {
                if (e.keyCode == 13) {
                    $this.load();
                    return false; // prevent the button click from happening
                }
            });
        }
        // Sort in Middle
        if ($this.options.sortCols && $this.options.sortCols.length > 0) {
            let _select = $('<select/>', { class: 'form-control', style: 'width:70%;display:inline;', id: this.sortbyId });
            $.each($this.options.sortCols, function (i, o) {
                _select.append($('<option/>', { value: o.value + '-asc', text: o.text + ' - Asc', 'data-val': o.value, 'sort-direction': 'asc' }));
                _select.append($('<option/>', { value: o.value + '-desc', text: o.text + ' - Desc', 'data-val': o.value, 'sort-direction': 'desc' }));
            });
            _select.change(function () {
                $this.Pagination.sidx = $('option:selected', this).attr('data-val');
                $this.Pagination.sord = $('option:selected', this).attr('sort-direction');;
                $this.reload();
            });

            let _divbox1 = $('<div/>', { style: 'float:left;width:60%;text-align:left;' });
            _divbox1.append('Sort by : ').append(_select)
            let _divbox2 = $('<div/>', { style: 'float:right;width:40%' });
            // View Changer

            let _button1 = $('<button/>', { class: 'btn btn-default', 'data-type': 'table' }).append('<i class="fa fa-table" aria-hidden="true"></i>');
            let _button2 = $('<button/>', { class: 'btn btn-default', 'data-type': 'card' }).append('<i class="fa fa-credit-card" aria-hidden="true"></i>');
            let _btnGroup = $('<div/>', { class: 'btn-group btn-toggle' });

            if (this.options.currentView === 'card') {
                _button1.removeClass('btn-primary active'); _button2.addClass('btn-primary active');
            } else {
                _button2.removeClass('btn-primary active'); _button1.addClass('btn-primary active');
            }
            _btnGroup.append(_button2).append(_button1);
            if (this._allowToSwitchView) {
                _divbox2.append('View : ');
                _divbox2.append(_btnGroup);
            }
            _divMiddle.append(_divbox1).append(_divbox2);
            _divbox2.find('.btn-toggle').click(function () {
                $(this).find('.btn').toggleClass('active');
                if ($(this).find('.btn-primary').length > 0) {
                    $(this).find('.btn').toggleClass('btn-primary');
                }
                $(this).find('.btn').toggleClass('btn-default');
                if ($(this).find('.btn[data-type="table"]').hasClass('active')) {
                    $this.options.currentView = 'table';
                    window.localStorage.setItem('cardgrid-view', 'table');
                } else {
                    $this.options.currentView = 'card';
                    window.localStorage.setItem('cardgrid-view', 'card');
                }
                $this.buildCardTable($this, $this.getData().Data);
            });

        }
        // Buttton on Right
        if (this.options.buttons && this.options.buttons.length > 0) {
            let _buttonsDiv = this.createButtons(this.options.buttons);
            _divRight.append(_buttonsDiv);
        }
        _divRow.append(_divLeft).append(_divMiddle).append(_divRight);
        _divHeader.append(_divRow);
        return _divHeader[0] as HTMLDivElement;
    }
    // Footer
    private createFooter(): HTMLDivElement {
        let $this = this;
        let _footrow = $('<div/>', { class: 'footrow row', style: 'padding-top: 20px;' });
        let _left_cols = $('<div/>', { class: 'col-xs-12 col-lg-5 col-md-12 col-sm-12' });
        let _middle_cols = $('<div/>', { class: 'col-xs-12 col-lg-2 col-md-12 col-sm-12' });
        let _right_cols = $('<div/>', { class: 'col-xs-12 col-lg-5 col-md-6 col-sm-12' });
        // No of Records selector
        if ($this.options.recordsPerPage.length > 1) {
            let _pagesize_selector = $('<select/>', { id: $this.pageSizeSelect, style: 'width: 80px;display:inline', class: 'form-control' });
            let storedPerpage = window.localStorage.getItem('cardgrid-stored-per-page') ? window.localStorage.getItem('cardgrid-stored-per-page') : $this.options.recordsPerPage[0];
            $.each($this.options.recordsPerPage, function (i, o) {
                var _opt = $('<option/>', { value: o, text: o });
                if (o == storedPerpage)
                    _opt.attr("selected", "selected");

                _pagesize_selector.append(_opt);
            });

            _pagesize_selector.change(function () {
                $this.Pagination.rows = $(this).val();
                $this.Pagination.page = 1;
                window.localStorage.setItem('cardgrid-stored-per-page', $(this).val());
                $this.reload();
            });
            _left_cols.append($('<div/>', { class: 'col-xs-6 col-lg-6 col-md-6 col-sm-6' }).append('Row Count :').append(_pagesize_selector));
        }
        // Go TO page
        let _page_input = $('<input/>', { id: this.goToPageControlId, type: 'text', style: 'width: 80px;display:inline', class: 'form-control' });
        $(_page_input).on("keypress", function (e) {

            if (e.keyCode == 13) {
                if (this.value === '' || parseInt(this.value) > $this.Pagination.noOfPages) {
                    alert('Out of Range! ' + $this.Pagination.noOfPages + ' Pages Available');
                } else {
                    $this.Pagination.page = parseInt(this.value);
                    $this.reload();
                }
                return false; // prevent the button click from happening
            }
        });
        // From 1-12 records Like that

        _middle_cols.append($('<div/>', { class: 'col-center', style: 'text-align:center', id: this.viewControlId }));
        _left_cols.append($('<div/>', { class: 'col-xs-6 col-lg-6 col-md-6 col-sm-6' }).append('Go To Page :').append(_page_input));
        // Pagination
        let _pagination_div = $('<div/>', { id: this.paginationControlId });
        _right_cols.append($('<div/>', { class: 'card-paginaton' }).append(_pagination_div));
        $(_footrow).append(_left_cols).append(_middle_cols).append(_right_cols);
        return $(_footrow)[0] as HTMLDivElement;
    }
    // Generate Buttons
    private createButtons(buttons: Array<Button>): HTMLElement {
        let $this = this;
        let options = $this.options;
        let _divToolbox = $('<div/>', { class: 'btn-group nav navbar-right panel_toolbox' });
        $.each(buttons, function (index, element) {
            element = $.extend({
                id: '-btn-' + (index + 1),
                enable: true,
                hidden: false,
                buttons: null,
                onClick: null
            }, element);
            if (element.buttons === null) {
                let _btn = $('<button/>', { text: element.text, class: 'btn btn-default', id: $this.cardGridId + element.id });
                if (element.enable)
                    _btn.removeClass('disabled');
                else
                    _btn.addClass('disabled');
                if (element.className)
                    _btn.addClass(element.className);
                if (element.onClick) {
                    $(_btn).click(function () {
                        element.onClick(options.data);
                    });
                }
                if (element.hidden)
                    _btn.hide();
                else
                    _btn.show();
                _divToolbox.append(_btn);
            } else {
                if (element.buttons && element.buttons.length > 0) {
                    let _divbtnGroup = $('<div/>', { class: 'btn-group' });
                    let _btn = $('<button/>', { text: element.text, class: 'btn btn-default', id: $this.cardGridId + element.id });
                    if (element.className)
                        _btn.addClass(element.className);
                    if (element.onClick) {
                        $(_btn).click(function () {
                            element.onClick(options.data);
                        });
                    }
                    if (element.hidden)
                        _btn.hide();
                    else
                        _btn.show();
                    _divbtnGroup.append(_btn);
                    let _btnGroup = $('<button/>', { 'data-toggle': 'dropdown', class: 'btn btn-default dropdown-toggle', type: 'button', 'aria-expanded': 'false' });
                    _btnGroup.append('<span class="caret"></span>');
                    let _ul = $('<ul/>', { class: 'dropdown-menu' });
                    $.each(element.buttons, function (i, el) {
                        el = $.extend({
                            id: '-btn-' + (index + 1) + '-' + (i + 1),
                            enable: true,
                            hidden: false,
                            onClick: null
                        }, el);
                        let _a = $('<a/>', { href: '#', html: el.text, id: $this.cardGridId + element.id });
                        if (el.onClick) {
                            $(_a).click(function (e) {
                                e.preventDefault();//this will prevent the link trying to navigate to another page
                                el.onClick(options.data);
                            });
                        }
                        let _li = $('<li/>').append(_a).appendTo(_ul);
                        if (el.hidden)
                            _li.hide();
                        else
                            _li.show();
                    });
                    _btnGroup.appendTo(_divbtnGroup);
                    _ul.appendTo(_divbtnGroup);
                    _divbtnGroup.appendTo(_divToolbox);
                }
            }


        });
        $('.dropdown-toggle').dropdown();
        return _divToolbox[0];
    }

    // Get all Selected Data
    public getSelectedData(): Array<any> {
        let $this = this;
        let arr: Array<any> = new Array();
        let _carddiv = document.getElementById($this.cardRowId);
        if (_carddiv) {
            if ($this.options.currentView === 'card') {
                let _divs = $(_carddiv).find('[selected]').parent();
                //should be modified to this.options.data.data;
                $.each(_divs, function (ind, ctrl) {
                    $.each($this.getData().Data, function (index, data) {
                        let num: number = parseInt($(ctrl).attr('data-id'));
                        if (data.Id === num) {
                            arr.push(data);
                        }
                    });
                });
            }
            else {
                let _trs = $(_carddiv).find('table').find('tr[selected="selected"]');
                $.each(_trs, function (idx: number, obj: any) {
                    $.each($this.getData().Data, function (index: number, data: any) {
                        let num: number = parseInt($(obj).attr('data-id'));
                        if (data.Id === num) {
                            arr.push(data);
                        }
                    });
                });
            }
        }
        return arr;
    }

    public getSelectedIds(): Array<any> {
        let selectedData = this.getSelectedData();
        let arr: Array<any> = new Array();
        $.each(selectedData, function (idx: number, obj: any) {
            arr.push(obj.Id);
        });
        return arr;
    }
}


interface JQuery {
    cardGrid(options: Options): CardGrid;
}
(function ($) {
    $.fn.cardGrid = function (options: Options): CardGrid {
        let cardGrid = new CardGrid($(this), options);
        return cardGrid;
    }
})(jQuery);