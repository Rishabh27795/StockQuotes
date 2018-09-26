/**
 *  The Stock Quotes App displays
 *  current stock prices using
 *  google charts.
 *
 *  @author     Rishabh Modi
 *  @version    1.0
 */

var stock_symbol, stock_price;
var chart_stockList = [];
var existing_stocks = [];
var batchTimer;


/**
 * Function to add stock to the list and
 * call the IEX API to fetch the JSON
 * data and set chart values
 */
function printstock() {
    var stockName, listNode, liNode, textNode;
    stockName = document.getElementById("stock").value;
    stockName = stockName.toUpperCase();
    listNode = document.getElementById("stockList");
    liNode = document.createElement("LI");
    liNode.setAttribute("class", "list-group-item");
    textNode = document.createTextNode(stockName);
    document.getElementById("errorMessage").innerHTML = "";
    document.getElementById("addButton").disabled = true;
    document.getElementById("stock").value = "";
    document.getElementById("errorMessage").setAttribute("class", "");

    // Clear and set chart update timer with respect to user input
    if (batchTimer !== undefined) {
        clearInterval(batchTimer);
    }
    batchTimer = setInterval(batchAPICall, 5000);

    //API call to fetch stock data
    var apiCall = new XMLHttpRequest();
    apiCall.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            apiCall = JSON.parse(this.responseText);
            stock_symbol = apiCall.quote.symbol;
            stock_price = apiCall.quote.latestPrice;
            var selectedStock = [stock_symbol, stock_price, "$" + stock_price];
            chart_stockList.push(selectedStock)
            google.charts.load('current', {packages: ['corechart', 'bar']});
            google.charts.setOnLoadCallback(drawMaterial);

            liNode.appendChild(textNode);
            listNode.appendChild(liNode);

            var encodedStockName = encodeURIComponent(stockName);
            existing_stocks.push(encodedStockName);
            document.getElementById("addButton").disabled = false;

        } else if (this.status === 404) {
            document.getElementById("errorMessage").setAttribute("class", "alert alert-danger ");
            document.getElementById("errorMessage").innerHTML = "No stock named " + stockName + " exists";
            document.getElementById("addButton").disabled = false;

        }
    };
    if (existing_stocks.includes(stockName)) {
        document.getElementById("errorMessage").setAttribute("class", "alert alert-danger ");
        document.getElementById("errorMessage").innerHTML = stockName + " already exists";
        document.getElementById("addButton").disabled = false;
    }
    else {
        apiCall.open("GET", "https://api.iextrading.com/1.0/stock/" + stockName + "/book", true);
        apiCall.send();
    }

}


/**
 * Function to update currently present
 * stock data based on the
 * previously set timer
 */
function batchAPICall() {

    var symbolList = "" + existing_stocks[0];
    for (var i = 1; i < existing_stocks.length; i++) {
        symbolList += "," + existing_stocks[i];
    }


    var batchCall = new XMLHttpRequest();
    batchCall.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            var response = JSON.parse(this.responseText);
            for (var j = 0; j < chart_stockList.length; j++) {
                chart_stockList[j][1] = response[chart_stockList[j][0]].price;
                google.charts.load('current', {packages: ['corechart', 'bar']});
                google.charts.setOnLoadCallback(drawMaterial);
            }

        }
    };
    batchCall.open("GET", "https://api.iextrading.com/1.0/stock/market/batch?symbols=" + symbolList + "&types=price")
    batchCall.send();

}


/**
 * Function to render chart
 * using google charts API
 */
function drawMaterial() {

    dataTable = new google.visualization.DataTable();

    dataTable.addColumn('string', 'Company');
    dataTable.addColumn('number', 'Stock Price');
    dataTable.addColumn({type: 'string', role: 'annotation'});


    for (var i = 0; i < chart_stockList.length; i++) {
        dataTable.addRow(chart_stockList[i]);
    }

    var options = {
        title: 'Stock Prices',
        chartArea: {width: '50%'},
        hAxis: {
            title: 'Price in Dollars',
            minValue: 0
        }
    };

    var chart = new google.visualization.BarChart(document.getElementById('chart_div'));

    chart.draw(dataTable, options);
}


/**
 * Function to modify form's
 * 'submit' event behaviour
 */
document.getElementById("stockForm").addEventListener('submit', function (event) {
    event.preventDefault();
    printstock();
});
