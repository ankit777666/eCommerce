import { LightningElement, wire } from 'lwc';
import { getPicklistValues } from 'lightning/uiObjectInfoApi';


// Product schema
//import BRAND_FIELD from '@salesforce/schema/Product__c.Brand__c';
//import PRICE_FIELD from '@salesforce/schema/Product__c.Price__c';
import OS_FIELD from '@salesforce/schema/Product__c.Operating_System__c';
import RAM_FIELD from '@salesforce/schema/Product__c.Material__c';
import STORAGE_FIELD from '@salesforce/schema/Product__c.Storage_Capacity__c';

// Lightning Message Service and a message channel
import { publish, MessageContext } from 'lightning/messageService';
import PRODUCTS_FILTERED_MESSAGE from '@salesforce/messageChannel/ProductsFiltered__c';

// The delay used when debouncing event handlers before firing the event
const DELAY = 350;

/**
 * Displays a filter panel to search for Product__c[].
 */
export default class ProductFilter extends LightningElement {
    searchKey = '';
    maxPrice = 10000;

    filters = {
        searchKey: '',
        maxPrice: 10000,
        os:'',
        ram:'',
        storage:''
    };

    @wire(MessageContext)
    messageContext;

    @wire(getPicklistValues, {
        // recordTypeId: '012000000000000AAA',
        fieldApiName: OS_FIELD
    })
    os;

    @wire(getPicklistValues, {
        // recordTypeId: '012000000000000AAA',
        fieldApiName: RAM_FIELD
    })
    ram;

    @wire(getPicklistValues, {
        // recordTypeId: '012000000000000AAA',
        fieldApiName: STORAGE_FIELD
    })
    storage;

    handleSearchKeyChange(event) {
        this.filters.searchKey = event.target.value;
        this.delayedFireFilterChangeEvent();
    }

    handleMaxPriceChange(event) {
        const maxPrice = event.target.value;
        this.filters.maxPrice = maxPrice;
        this.delayedFireFilterChangeEvent();
    }

    handleCheckboxChange(event) {
        if (!this.filters.os) {
            // Lazy initialize filters with all values initially set
            this.filters.os = this.os.data.values.map(
                (item) => item.value
            );
            this.filters.ram = this.ram.data.values.map(
                (item) => item.value
            );
            this.filters.storage = this.storage.data.values.map(
                (item) => item.value
            );
        }
        const value = event.target.dataset.value;
        const filterArray = this.filters[event.target.dataset.filter];
        if (event.target.checked) {
            if (!filterArray.includes(value)) {
                filterArray.push(value);
            }
        } else {
            this.filters[event.target.dataset.filter] = filterArray.filter(
                (item) => item !== value
            );
        }
        // Published ProductsFiltered message
        publish(this.messageContext, PRODUCTS_FILTERED_MESSAGE, {
            filters: this.filters
        });
    }

    delayedFireFilterChangeEvent() {
        // Debouncing this method: Do not actually fire the event as long as this function is
        // being called within a delay of DELAY. This is to avoid a very large number of Apex
        // method calls in components listening to this event.
        window.clearTimeout(this.delayTimeout);
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this.delayTimeout = setTimeout(() => {
            // Published ProductsFiltered message
            publish(this.messageContext, PRODUCTS_FILTERED_MESSAGE, {
                filters: this.filters
            });
        }, DELAY);
    }
}
