class alkatriaPagination {
    constructor(totalSize, perPage, currPage, arrayOfEntries) {
        this.size = {
            "total": totalSize,
            "pPage": perPage
        };
        this.items = arrayOfEntries;
        this.currPage = currPage;
    }
    chunkArray(arr, chunkSize) {
        if (chunkSize <= 0) throw "Invalid chunk size";
        const arrContainer = [];
        for (var i=0,len=arr.length; i<len; i+=chunkSize) container.push(arrContainer.slice(i,i+chunkSize));
        return arrContainer;
    }
    getPages() {
        const pages = Math.ceil(this.size["total"] / this.size["pPage"]);
        return pages;
    }
    getItems(currPage) {
        const pageItems = this.chunkArray(this.items, this.size["pPage"])[currPage];
        return pageItems;
    }
    alkaLogic(totalPages) {
        const currentPage = totalPages;
        const range = 6;
        const totalItems = 10;

        const paging = [];

        let start = 1;

        if (currentPage < (range / 2) + 1 ) {
            start = 1
        } else if (currentPage >= (totalPages - (range / 2) )) {
            start = Math.floor(totalPages - range + 1);
        } else {
            start = (currentPage - Math.floor(range / 2));
        }

        for (let i = start; i <= ((start + range) - 1); i++) {
            if (i === currentPage) {
                paging.push(`<div class="auction-page current" onclick="currPagination.setPage(${i})">${i}</div>`);
            } else {
                paging.push(`<div class="auction-page" onclick="currPagination.setPage(${i})">${i}</div>`);
            }
        }
        return paging.join("");
    }
    setPage(pageSelected) {
        const pages = this.getPages();
        this.currPage = pageSelected;
        document.querySelector("#alkatriaPagination").parentNode.innerHTML = `<div id="alkatriaPagination">${this.alkaLogic(pageSelected)}</div>`;
    }
    init() {
        window.currPagination = this;
        const pages = this.getPages();
        const tableFoot = document.createElement("tfoot");
        tableFoot.innerHTML = `<div id="alkatriaPagination">${this.alkaLogic(this.currPage)}</div>`;
        document.querySelector(".auction-list").appendChild(tableFoot);
    }
}
