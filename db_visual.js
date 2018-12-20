var DBVisual = /** @class */ (function () {
    function DBVisual(doc, $) {
        this.doc = doc;
        this.$ = $;
        this.allTables = {};
    }
    DBVisual.prototype.load = function (tableName) {
        var _this = this;
        DBVisual.loadTable(tableName, function (schema) { return _this.renderTableSchema(schema); });
    };
    DBVisual.prototype.createEl = function (element, className, content) {
        var el = this.doc.createElement(element);
        if (!!className)
            el.className = className;
        if (!!content)
            el.textContent = content;
        return el;
    };
    // see https://www.w3schools.com/howto/howto_js_draggable.asp
    DBVisual.prototype.dragElement = function (target, header) {
        var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        var instance = this;
        header.onmousedown = dragMouseDown;
        function dragMouseDown(e) {
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            instance.doc.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            instance.doc.onmousemove = elementDrag;
        }
        function elementDrag(e) {
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            target.style.top = (target.offsetTop - pos2) + "px";
            target.style.left = (target.offsetLeft - pos1) + "px";
            instance.$('.my-connect-dot').connections('update');
        }
        function closeDragElement() {
            // stop moving when mouse button is released:
            instance.doc.onmouseup = null;
            instance.doc.onmousemove = null;
        }
    };
    DBVisual.prototype.showHide = function (el) {
        el.style.display = el.style.display === 'none' ? '' : 'none';
        this.$('.my-connect-dot').connections('update');
    };
    ;
    DBVisual.prototype.addConnection = function (el, to) {
        var connectDot = this.createEl('div', 'my-connect-dot');
        el.appendChild(connectDot);
        this.$(connectDot).connections({ to: to });
    };
    DBVisual.prototype.addTableName = function (table, schema) {
        var tableName = this.createEl('div', 'my-table-name my-item', schema.name);
        table.appendChild(tableName);
        this.dragElement(table, tableName);
    };
    DBVisual.prototype.addFieldList = function (table, header, list) {
        var _this = this;
        var fieldHeader = this.createEl('div', 'my-header', header);
        var fieldList = this.createEl('div');
        fieldList.style.display = 'none';
        fieldHeader.onclick = function () { return _this.showHide(fieldList); };
        var fieldEl;
        list.forEach(function (fieldName) {
            fieldEl = _this.createEl('div', 'my-field-list-item my-item', fieldName);
            fieldList.appendChild(fieldEl);
        });
        table.appendChild(fieldHeader);
        table.appendChild(fieldList);
    };
    DBVisual.prototype.addIndexList = function (table, schema) {
        var _this = this;
        var indexHeader = this.createEl('div', 'my-header', 'INDEXES');
        var indexList = this.createEl('div', 'my-index-list');
        var indexEl;
        var instance = this;
        schema.indexes.forEach(function (index) {
            var cssClass = ['my-item', 'my-index-list-item'];
            if (!!index.cascade)
                cssClass.push('my-index-cascade');
            if (!!index.unique)
                cssClass.push('my-index-unique');
            if (!!index.fktable)
                cssClass.push('my-index-fk');
            indexEl = _this.createEl('div', cssClass.join(" "), index.field);
            indexEl.onclick = function () {
                if (!index.fktable)
                    return;
                var that = this;
                if (!!instance.allTables[index.fktable] &&
                    that.getElementsByClassName('my-connect-dot').length !== 0) {
                    instance.addConnection(that, instance.allTables[index.fktable]);
                    return;
                }
                DBVisual.loadTable(index.fktable, function (schema) {
                    if (!schema)
                        return;
                    var newTable = instance.renderTableSchema(schema);
                    instance.addConnection(that, newTable);
                });
            };
            indexList.appendChild(indexEl);
            if (!!index.fktable && !!instance.allTables[index.fktable])
                instance.addConnection(indexEl, instance.allTables[index.fktable]);
        });
        table.appendChild(indexHeader);
        table.appendChild(indexList);
    };
    DBVisual.prototype.addForeignTableList = function (table, schema) {
        var _this = this;
        var foreignHeader = this.createEl('div', 'my-header', 'FOREIGN TABLES');
        var foreignList = this.createEl('div', 'my-foreign-list');
        foreignHeader.onclick = function () { return _this.showHide(foreignList); };
        var foreignEl;
        var instance = this;
        schema.foreigns.forEach(function (foreign) {
            foreignEl = _this.createEl('div', 'my-foreign-list-item my-item', foreign);
            foreignEl.onclick = function () {
                if (!!instance.allTables[foreign])
                    return;
                DBVisual.loadTable(foreign, function (schema) {
                    if (!schema)
                        return;
                    instance.renderTableSchema(schema);
                });
            };
            foreignList.appendChild(foreignEl);
        });
        table.appendChild(foreignHeader);
        table.appendChild(foreignList);
    };
    DBVisual.prototype.renderTableSchema = function (schema) {
        if (!!this.allTables[schema.name])
            return;
        var table = this.createEl('div', 'my-table');
        this.addTableName(table, schema);
        this.addFieldList(table, 'FIELDS', schema.fields);
        this.addFieldList(table, 'KEYS', schema.keys);
        this.addIndexList(table, schema);
        this.addForeignTableList(table, schema);
        this.doc.body.appendChild(table);
        this.$('.my-connect-dot').connections('update');
        this.allTables[schema.name] = table;
        return table;
    };
    DBVisual.loadTable = function (tableName, callBack) {
        var req = new XMLHttpRequest();
        req.addEventListener("load", function () {
            callBack(JSON.parse(this.responseText));
        });
        req.open("GET", "/load?" + tableName);
        req.send();
    };
    return DBVisual;
}());
window.dbVisual = new DBVisual(document, $);
