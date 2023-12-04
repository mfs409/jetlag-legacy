# Slideshow Demo

### [.center] Michael Spear

## Outline

* Show basic stuff
* Show advanced stuff
* Wrap up

## Highlighting Code with Showdown

1. Below we have a piece of JavaScript code:

```javascript
function sayHello (msg, who) {
    return `${who} says: msg`;
}
sayHello("Hello World", "Johnny");
```

2. And here's C/C++

```c++
int main(int argc, char** argv) {
  printf("Hello world\n");
}
```

## Other Stuff

* We can do lots with text in markdown:
  * **bold**
  * *italics*
  * __underline__
  * ~~strikethrough~~
  * Even @@red color (__markable__)@@

* This was made by <spear@lehigh.edu>

Visit <http://www.cse.lehigh.edu>
[this link](www.cse.lehigh.edu)

## Tables

| Name    | Business       |
| ------- | -------------- |
| Alice   | Many companies |
| Bob     | None           |
| Satoshi | Don't ask      |

## Math

$$-b \pm \frac{\sqrt{b^2-4ac}}{{2a}}$$

inline math $x+1$ is fun.

## Mermaid Test

```mermaid
graph TD;
    A-->B;
    A-->C;
    B-->D;
    C-->D;
```

## Data Plots

* This

```vega
{
  "width": 800,
  "height": 400,
  "data": {"url": "seattle-weather.csv"},
  "mark": "bar",
  "encoding": {
    "x": {"timeUnit": "month", "field": "date", "type": "ordinal", "axis":{"labelFontSize":24, "titleFontSize": 28}},
    "y": {"aggregate": "mean", "field": "precipitation", "axis": {"labelFontSize":24,"titleFontSize":28}},
    "color": {"value":"green"}
  }
}
```

* Or this

```vega
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "data": {
    "values": [
      {"category":"A", "group": "x", "value":0.1},
      {"category":"A", "group": "y", "value":0.6},
      {"category":"A", "group": "z", "value":0.9},
      {"category":"B", "group": "x", "value":0.7},
      {"category":"B", "group": "y", "value":0.2},
      {"category":"B", "group": "z", "value":1.1},
      {"category":"C", "group": "x", "value":0.6},
      {"category":"C", "group": "y", "value":0.1},
      {"category":"C", "group": "z", "value":0.2}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "category"},
    "y": {"field": "value", "type": "quantitative"},
    "xOffset": {"field": "group"},
    "color": {"field": "group"}
  }
}
```

## We can get too fancy with interactive charts

* Still don't know how to get good legend titles

```vega
{
  "$schema": "https://vega.github.io/schema/vega/v5.json",
  "description": "A basic line chart example.",
  "width": 500,
  "height": 200,
  "padding": 5,

"legends": [
    {
      "fill": "color",
      "title": "This is the Title",
      "orient": "top-left",
      "encode": {
        "symbols": {"enter": {"fillOpacity": {"value": 0.5}}},
        "labels": {"update": {"text": {"field": "value"}}}
      }
    }
  ],

  "data": [
    {
      "name": "table",
      "values": [
        {"x": 0, "y": 28, "c":0}, {"x": 0, "y": 20, "c":1},
        {"x": 1, "y": 43, "c":0}, {"x": 1, "y": 35, "c":1},
        {"x": 2, "y": 81, "c":0}, {"x": 2, "y": 10, "c":1},
        {"x": 3, "y": 19, "c":0}, {"x": 3, "y": 15, "c":1},
        {"x": 4, "y": 52, "c":0}, {"x": 4, "y": 48, "c":1},
        {"x": 5, "y": 24, "c":0}, {"x": 5, "y": 28, "c":1},
        {"x": 6, "y": 87, "c":0}, {"x": 6, "y": 66, "c":1},
        {"x": 7, "y": 17, "c":0}, {"x": 7, "y": 27, "c":1},
        {"x": 8, "y": 68, "c":0}, {"x": 8, "y": 16, "c":1},
        {"x": 9, "y": 49, "c":0}, {"x": 9, "y": 25, "c":1}
      ]
    }
  ],

  "scales": [
    {
      "name": "x",
      "type": "point",
      "range": "width",
      "domain": {"data": "table", "field": "x"}
    },
    {
      "name": "y",
      "type": "linear",
      "range": "height",
      "nice": true,
      "zero": true,
      "domain": {"data": "table", "field": "y"}
    },
    {
      "name": "color",
      "type": "ordinal",
      "range": "category",
      "domain": {"data": "table", "field": "c"}
    }
  ],

  "axes": [
    {"orient": "bottom", "scale": "x"},
    {"orient": "left", "scale": "y"}
  ],

  "marks": [
    {
      "type": "group",
      "from": {
        "facet": {
          "name": "series",
          "data": "table",
          "groupby": "c"
        }
      },
      "marks": [
        {
          "type": "line",
          "from": {"data": "series"},
          "encode": {
            "enter": {
              "x": {"scale": "x", "field": "x"},
              "y": {"scale": "y", "field": "y"},
              "stroke": {"scale": "color", "field": "c"},
              "strokeWidth": {"value": 2}
            },
            "hover": {
              "strokeOpacity": {"value": 0.5}
            }
          }
        }
      ]
    }
  ]
}
```

```md-config
div-wrapper-class = slide
page-title = Markdown Experiments
.red  {color: red}
.black  {background-color: black; color: white}
.green  {color: green}
.mytable  {color: #ff00ff; border: solid #ffff00 1px}
.big-red  {background-color: red; font-size: 24}
.graph  {border: solid black 1px}

.precipchart {width: 75%; margin: auto;}

```
