# PNG.js
Output images in JavaScript as PNG format.  

## Support format  
1/2/4/8/24bit (support transparent)  

## How to use 

English

```rb
// *** Constructor   
// First argument : ImageData object  
var PNGWriter = new TPNGWriter(imagedata);

// *** Method  
// First  argument : file name
// Second argument : (Optional)Transparent color(Red)   0-255
// Third  argument : (Optional)Transparent color(Green) 0-255
// Fourth argument : (Optional)Transparent color(Blue)  0-255
PNGWriter.SaveToFile('untitle.png',r,g,b);

```

Japanese  
```rb
// *** コンストラクタ   
// 第一引数 : ImageData オブジェクト  
var PNGWriter = new TPNGWriter(imagedata);

// *** メソッド  
// 第一引数 : ファイル名
// 第二引数 : (省略可能)背景を透過する色(Red)   0-255
// 第三引数 : (省略可能)背景を透過する色(Green) 0-255
// 第四引数 : (省略可能)背景を透過する色(Blue)  0-255
PNGWriter.SaveToFile('untitle.png',r,g,b);

``` 

## Caution
If the HTML file is not uploaded to the server, it may not work depending on browser specifications.

HTML5 Web Worker makes it multi-threaded and faster.  

HTMLファイルがサーバーにアップロードされていない場合、ブラウザの仕様によっては動作しないことがあります。

HTML5の新機能であるWeb Workerを使用するとマルチスレッドで高速に並列処理が可能です。

## Contact
sorry, no warranty, no support. English Can understand only 3-year-old level.  

## Author
Copyright (c) 2016 Takeshi Okamoto

## Licence
MIT license.  

## Accompanying files (zlib.min.js)
[Mr. imaya](https://github.com/imaya/zlib.js/) created.
