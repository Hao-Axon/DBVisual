declare let $: any;

interface TableIndex {
    field: string, 
    fktable?: string,
    fkcolumns?: string, 
    cascade?: boolean,
    unique?: boolean,
}

interface TableSchema {
    name: string;
    fields: string[];
    keys: string[];
    indexes: TableIndex[];
    foreigns: string[];
    trigger?: string;
}

class DBVisual {
    private allTables: {[key: string]: HTMLElement} = {};

    constructor(private doc: Document, private $: any) {}

    public load(tableName: string) {
        DBVisual.loadTable(tableName, 
            (schema: TableSchema) => this.renderTableSchema(schema));
    }

    private createEl(element: string, className?: string, content?: string) {
        let el = this.doc.createElement(element);
        if (!!className)
            el.className = className;
        if (!!content)
            el.textContent = content;
        return el;
    }

    // see https://www.w3schools.com/howto/howto_js_draggable.asp
    private dragElement(target: HTMLElement, header: HTMLElement) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
        let instance = this;
        header.onmousedown = dragMouseDown;
    
        function dragMouseDown(e: MouseEvent) {
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            instance.doc.onmouseup = closeDragElement;
            // call a function whenever the cursor moves:
            instance.doc.onmousemove = elementDrag;
        }
    
        function elementDrag(e: MouseEvent) {
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
    }

    private showHide(el: HTMLElement) {
        el.style.display = el.style.display === 'none' ?  '' : 'none';
        this.$('.my-connect-dot').connections('update');
    };

    private addConnection(el: HTMLElement, to: HTMLElement) {
        let connectDot = this.createEl('div', 'my-connect-dot');
        el.appendChild(connectDot);
        this.$(connectDot).connections({ to: to });
    }

    private addTableName(table: HTMLElement, schema: TableSchema) {
        let tableName = this.createEl('div', 'my-table-name my-item', schema.name);
        table.appendChild(tableName);
        this.dragElement(table, tableName);
    }

    private addFieldList(table: HTMLElement, header: string, list: string[]) {
        let fieldHeader = this.createEl('div', 'my-header', header);
        let fieldList = this.createEl('div');
        fieldList.style.display = 'none';
        fieldHeader.onclick = () => this.showHide(fieldList);
        let fieldEl: HTMLElement;
        list.forEach(fieldName => {
            fieldEl = this.createEl('div', 'my-field-list-item my-item', fieldName);
            fieldList.appendChild(fieldEl);
        });
        table.appendChild(fieldHeader);
        table.appendChild(fieldList);
    }

    private addIndexList(table: HTMLElement, schema: TableSchema) {
        let indexHeader = this.createEl('div', 'my-header', 'INDEXES');
        let indexList = this.createEl('div', 'my-index-list');
        let indexEl: HTMLElement;
        let instance = this;
        schema.indexes.forEach(index => {
            let cssClass = ['my-item', 'my-index-list-item'];
            if (!!index.cascade)
                cssClass.push('my-index-cascade');
            if (!!index.unique)
                cssClass.push('my-index-unique');
            if (!!index.fktable)
                cssClass.push('my-index-fk');
            indexEl = this.createEl('div', cssClass.join(" "), index.field);
                
            indexEl.onclick = function() {
                if (!index.fktable)
                    return;
                let that = this as HTMLElement;
    
                if (!!instance.allTables[index.fktable] && 
                    that.getElementsByClassName('my-connect-dot').length !== 0) {
                    instance.addConnection(that, instance.allTables[index.fktable]);
                    return;
                }
                
                DBVisual.loadTable(index.fktable, (schema) => {
                    if (!schema)
                        return;
                    let newTable = instance.renderTableSchema(schema);
                    instance.addConnection(that, newTable);
                });
            };
            indexList.appendChild(indexEl);
            if (!!index.fktable && !!instance.allTables[index.fktable]) 
                instance.addConnection(indexEl, instance.allTables[index.fktable])
        });
        table.appendChild(indexHeader);
        table.appendChild(indexList);
    }

    private addForeignTableList(table: HTMLElement, schema: TableSchema) {
        let foreignHeader = this.createEl('div', 'my-header', 'FOREIGN TABLES');
        let foreignList = this.createEl('div', 'my-foreign-list');
        foreignHeader.onclick = () => this.showHide(foreignList);
        let foreignEl: HTMLElement;
        let instance = this;
        schema.foreigns.forEach(foreign => {
            foreignEl = this.createEl('div', 'my-foreign-list-item my-item', foreign);  
            foreignEl.onclick = function() {
                if (!!instance.allTables[foreign])
                    return;
                DBVisual.loadTable(foreign, (schema) => {
                    if (!schema)
                        return;
                    instance.renderTableSchema(schema);
                });
            };
            foreignList.appendChild(foreignEl);
        });
        table.appendChild(foreignHeader);
        table.appendChild(foreignList);
    }

    private renderTableSchema(schema: TableSchema) {
        if (!!this.allTables[schema.name])
            return;
        
        let table = this.createEl('div', 'my-table');
        this.addTableName(table, schema);
        this.addFieldList(table, 'FIELDS', schema.fields);
        this.addFieldList(table, 'KEYS', schema.keys);
        this.addIndexList(table, schema);
        this.addForeignTableList(table, schema);
    
        this.doc.body.appendChild(table);
        this.$('.my-connect-dot').connections('update');
    
        this.allTables[schema.name] = table;
        return table;
    }

    private static loadTable(tableName: string, callBack: (schema: TableSchema | false) => any) {
        let req = new XMLHttpRequest();
        req.addEventListener("load", function() {
            callBack(JSON.parse(this.responseText));
        });
        req.open("GET", "/load?" + tableName);
        req.send();
    }
}

(window as any).dbVisual = new DBVisual(document, $);