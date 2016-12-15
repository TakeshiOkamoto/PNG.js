/**************************************************/
/*                                                */
/*     PNG.js                                     */
/*                                      v0.88     */
/*                                                */
/*     Copyright 2016 Takeshi Okamoto (Japan)     */
/*                                                */
/*     Released under the MIT license             */
/*     https://github.com/TakeshiOkamoto/         */
/*                                                */
/*                            Date: 2016-12-16    */
/**************************************************/

////////////////////////////////////////////////////////////////////////////////
// Generic Class
////////////////////////////////////////////////////////////////////////////////

// ---------------------
//  TFileStream            
// ---------------------
function TFileStream(BufferSize) {

    if (BufferSize == undefined)
        this.MemorySize = 5000000; // 5M
    else
        this.MemorySize = parseInt(BufferSize, 10);

    this.Size = 0;
    this.Stream = new Uint8Array(this.MemorySize);
}

// ---------------------
//  TFileStream.Method     
// ---------------------
TFileStream.prototype = {

    _AsciiToUint8Array: function (S) {
        var len = S.length;
        var P = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            P[i] = S[i].charCodeAt(0);
        }
        return P;
    },

    WriteByte: function (value) {
        var P = new Uint8Array(1);
        
        P[0] = value;
        
        this.WriteStream(P);      
    },
    
    WriteWord: function (value) {
        var P = new Uint8Array(2);
        
        P[1] = (value & 0xFF00) >> 8;
        P[0] = (value & 0x00FF);  
        
        this.WriteStream(P);      
    },

    WriteDWord: function (value) {
        var P = new Uint8Array(4);
        
        P[3] = (value & 0xFF000000) >> 24;
        P[2] = (value & 0x00FF0000) >> 16;
        P[1] = (value & 0x0000FF00) >> 8;
        P[0] = (value & 0x000000FF);  
        
        this.WriteStream(P);      
    },
    
    WriteWord_Big: function (value) {
        var P = new Uint8Array(2);
        
        P[1] = (value & 0x00FF);
        P[0] = (value & 0xFF00) >> 8;  
        
        this.WriteStream(P);      
    },        
    
    WriteDWord_Big: function (value) {
        var P = new Uint8Array(4);
        
        P[3] = (value & 0x000000FF) 
        P[2] = (value & 0x0000FF00) >> 8;
        P[1] = (value & 0x00FF0000) >> 16;
        P[0] = (value & 0xFF000000) >> 24;;  
        
        this.WriteStream(P);      
    },
        
    WriteString: function (S) {
        var P = this._AsciiToUint8Array(S);

        // メモリの再編成
        if (this.Stream.length <= (this.Size + P.length)) {
            var B = new Uint8Array(this.Stream);
            this.Stream = new Uint8Array(this.Size + P.length + this.MemorySize);
            this.Stream.set(B.subarray(0, B.length));
        }

        this.Stream.set(P, this.Size);
        this.Size = this.Size + P.length;
    },

    WriteStream: function (AStream) {      
        
        // メモリの再編成
        if (this.Stream.length <= (this.Size + AStream.length)) {
            var B = new Uint8Array(this.Stream);
            this.Stream = new Uint8Array(this.Size + AStream.length + this.MemorySize);
            this.Stream.set(B.subarray(0, B.length));
        }

        this.Stream.set(AStream, this.Size);
        this.Size = this.Size + AStream.length;
    },

    getFileSize: function () {
        return this.Size;
    },

    SaveToFile: function (FileName,type) {
        if (window.navigator.msSaveBlob) {
            window.navigator.msSaveBlob(new Blob([this.Stream.subarray(0, this.Size)], { type: type }), FileName);
        } else {
            var a = document.createElement("a");
            a.href = URL.createObjectURL(new Blob([this.Stream.subarray(0, this.Size)], { type: type }));
            //a.target   = '_blank';
            a.download = FileName;
            document.body.appendChild(a); //  FF specification
            a.click();
            document.body.removeChild(a); //  FF specification
        }
    },
}

// ---------------------
//  TPNGWriter        
// ---------------------
function TPNGWriter(imagedata) {
  this.raw    = imagedata.data;
  this.width  = imagedata.width;
  this.height = imagedata.height;  

  // カラーパレットの生成
  this._getColorPalette();
}
  
TPNGWriter.prototype = {        
    
    // 画像からパレットの生成
    _getColorPalette: function () {
        var height = this.height;
        var width  = this.width;
        var raw    = this.raw;
        
        // 使用している色数の取得
        var cnt = 0;
        var uses_colors = new Object;
        
        for(var i = 0; i< height;i++){
            for(var j = 0; j< width;j++){
                var key = raw[cnt]   + ',' + 
                          raw[cnt+1] + ',' + 
                          raw[cnt+2] ;
                    uses_colors[key] = 1;        
                cnt = cnt + 4;
            }
        }
        
        var cnt = 0;
        for (var key in uses_colors) { cnt++; }
        
        // 24bit
        if (cnt > 256){
          
          this.palette = null;
          this.uses_colors = null;
          this.color_depth = 24;
        
        // 2/4/16/256色(1/2/4/8bit)   
        }else{        
          
          // 配列の設定
          var rgb,cnt = 0;
          var palette = new Array();   
          for (var key in uses_colors) {
              rgb = key.split(",");
              
              // 連想配列を配列へ変換
              palette[cnt] = {'r':parseInt(rgb[0],10),
                              'g':parseInt(rgb[1],10),
                              'b':parseInt(rgb[2],10)};
                                       
              // 連想配列へカラー番号を設定(高速化用)                         
              uses_colors[key] = cnt;
                  
              cnt++;                     
          }
          
          // ビット深度の設定         
          var len = palette.length;
          if(len >= 0 && len <=2){
            this.color_depth = 1;
          }else if(len >= 3 && len <=4){
            this.color_depth = 2;            
          }else if(len >= 5 && len <=16){
            this.color_depth = 4;
          }else if(len >= 17 && len <=256){
            this.color_depth = 8;            
          }
          
          this.palette = palette;
          this.uses_colors = uses_colors;
        }                
    },

    // イメージデータの書き込み
    _WriteImageData: function () {
        var onebyte  = 0;  // 1byte用
        var p_cnt    = 0;  // ストリームのカウンタ
        var img_cnt  = 0;  // イメージのカウンタ
        var line_cnt = 0;  // 一行のカウンタ
        
        var width  = this.width;
        var height = this.height;
        var raw    = this.raw;
        var color_depth = this.color_depth;  
        var uses_colors = this.uses_colors;      

        var P,LineWidth;
       
        // 1bit
        if (color_depth == 1){
          if (width % 8 != 0 ){
            var LineWidth = Math.floor(width/8)+1;
          }else{
            var LineWidth = width/8;
          }       
          P = new Uint8Array(LineWidth * height + height);
          
        // 2bit  
        }else if (color_depth == 2){
          if (width % 4 != 0 ){
            var LineWidth = Math.floor(width/4)+1;
          }else{
            var LineWidth = width/4;
          }       
          P = new Uint8Array(LineWidth*height + height);
                     
        // 4bit  
        }else if (color_depth == 4){
          if (width % 2 != 0 ){
            var LineWidth = Math.floor(width/2)+1;
          }else{
            var LineWidth = width/2;
          }       
          P = new Uint8Array(LineWidth*height + height); 
                 
        // 8bit  
        }else if (color_depth == 8){
          P = new Uint8Array(width*height + height);
          
        // 24bit  
        }else if (color_depth == 24){
          P = new Uint8Array(width*height*3 + height);
        }
              
        // ゼロクリア
        for (var j = 0; j < P.length; j++) { P[j] = 0; }    

        // *** 1bit
        if(color_depth == 1){            
            
            for (var i = 0; i < height; i++) {               
                line_cnt = 0;                 
                // 行の先頭に1byteのフィルタ(常に0)
                p_cnt++;  
                                
                for (var j = 0; j < LineWidth; j++) {
               
                    if (line_cnt < width){                      
                       onebyte  = uses_colors[raw[img_cnt]   + ',' +
                                              raw[img_cnt+1] + ',' + 
                                              raw[img_cnt+2] ] << 7;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                      
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 6;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                      
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 5;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                    
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 4;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                    
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 3;
                       img_cnt += 4;                            
                       line_cnt++;
                    }

                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 2;
                       img_cnt += 4;                            
                       line_cnt++;
                    } 
                    
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 1;
                       img_cnt += 4;                            
                       line_cnt++;
                    }  
                    
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ];
                       img_cnt += 4;                            
                       line_cnt++;
                    }     
                                                                                                           
                    P[p_cnt++] = onebyte;
                      
                  }
                  onebyte = 0;
            }   
            
        // *** 2bit
        }else if(color_depth == 2){            
            
            for (var i = 0; i < height; i++) {               
                line_cnt = 0;                 
                // 行の先頭に1byteのフィルタ(常に0)
                p_cnt++;  
                                
                for (var j = 0; j < LineWidth; j++) {
               
                    if (line_cnt < width){                      
                       onebyte  = uses_colors[raw[img_cnt]   + ',' +
                                              raw[img_cnt+1] + ',' + 
                                              raw[img_cnt+2] ] << 6;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                      
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 4;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                      
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 2;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                    
                    if (line_cnt < width){
                       onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ];
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                                                                                                           
                    P[p_cnt++] = onebyte;
                      
                  }
                  onebyte = 0;
            }   
        // *** 4bit       
        }else if(color_depth == 4){
            var onebyte = 0;
            
            for (var i = 0; i < height; i++) {               
                line_cnt = 0;                 
                // 行の先頭に1byteのフィルタ(常に0)
                p_cnt++;  
                                
                for (var j = 0; j < LineWidth; j++) {
              
                    if (line_cnt < width){
                        onebyte  = uses_colors[raw[img_cnt]   + ',' +
                                               raw[img_cnt+1] + ',' + 
                                               raw[img_cnt+2] ] << 4;
                       img_cnt += 4;                            
                       line_cnt++;
                    }
                    
                    if (line_cnt < width){
                        onebyte  |= uses_colors[raw[img_cnt]   + ',' +
                                                raw[img_cnt+1] + ',' + 
                                                raw[img_cnt+2] ];
                       img_cnt += 4;                            
                       line_cnt++;
                    }     
                                                                                                           
                    P[p_cnt++] = onebyte;
                      
                  }
                  onebyte = 0;
            }               
        
        // *** 8bit       
        }else if(color_depth == 8){  
            for (var i = 0; i < height; i++) { 
                line_cnt = 0;                 
                // 行の先頭に1byteのフィルタ(常に0)
                p_cnt++;  
                
                for (var j = 0; j < width; j++) {
                   P[p_cnt++] = uses_colors[raw[img_cnt]   + ',' +
                                            raw[img_cnt+1] + ',' + 
                                            raw[img_cnt+2] ];
                   img_cnt += 4;                                                   
                   line_cnt++;
                }             
             } 

        // *** 24bit       
        }else if(color_depth == 24){
            for (var i = 0; i < height; i++) { 
                line_cnt = 0;                 
                // 行の先頭に1byteのフィルタ(常に0)
                p_cnt++;  
                
                for (var j = 0; j < width; j++) {
                   P[p_cnt++] = raw[img_cnt];
                   P[p_cnt++] = raw[img_cnt+1];
                   P[p_cnt++] = raw[img_cnt+2];
                   
                   img_cnt += 4;  
                   line_cnt += 3;
                }
             } 
        }                    
        return P;      
    },
       
    SaveToStream: function (r,g,b) {
        var F = new TFileStream();
        var crc32,target_size;
               
        // -------------------------
        //  シグネチャ(8byte)
        // -------------------------
        
        // PNシグネチャ
        F.WriteByte(0x89);
        F.WriteByte(0x50);
        F.WriteByte(0x4E);
        F.WriteByte(0x47);
        F.WriteByte(0x0D);
        F.WriteByte(0x0A);
        F.WriteByte(0x1A);
        F.WriteByte(0x0A);    
                     
        // -------------------------
        //  IHDR(8byte)
        // -------------------------
                 
        // チャンクデータのサイズ
        F.WriteDWord_Big(13);
         
        // IHDR
        F.WriteByte(0x49);
        F.WriteByte(0x48);
        F.WriteByte(0x44);
        F.WriteByte(0x52);
                   
        // 画像の横幅
        F.WriteDWord_Big(this.width);

        // 画像の縦幅         
        F.WriteDWord_Big(this.height);
         
        // ビット深度(1,2,4,8,16)
        if (this.color_depth == 24){         
          F.WriteByte(8);
        }else{
          F.WriteByte(this.color_depth);
        }

        // カラータイプ(2:RGB 3:パレット 6:RGBA)
        if (this.color_depth == 24){
          // RGB
          F.WriteByte(2); 
          // RGBA
          // F.WriteByte(6);
        }else{
          // パレットインデックス
          F.WriteByte(3); 
        }
         
        // 圧縮方式(常に0)
        F.WriteByte(0);
         
        // フィルター(常に0)
        F.WriteByte(0);
         
        // インタレース(0:なし 1:あり)
        F.WriteByte(0);
        
        // CRC32
        target_size = (4+13);
        crc32 = Zlib.CRC32.calc(F.Stream,F.getFileSize()- target_size, target_size);    
        F.WriteDWord_Big(crc32);
                
        // -------------------------
        //  PLTE(省略可能)
        // -------------------------
        if (this.color_depth != 24){
         
          // チャンクデータのサイズ
          F.WriteDWord_Big(Math.pow(2,this.color_depth)*3);
         
          // PLTE
          F.WriteByte(0x50);
          F.WriteByte(0x4C);
          F.WriteByte(0x54);
          F.WriteByte(0x45);
           
          for (var i = 0; i < this.palette.length; i++) {
             F.WriteByte(this.palette[i].r);
             F.WriteByte(this.palette[i].g);
             F.WriteByte(this.palette[i].b);
          }  
          
          // 不足分のパレット
          for (var i = this.palette.length ; i < Math.pow(2,this.color_depth); i++) {
             F.WriteByte(0);
             F.WriteByte(0);
             F.WriteByte(0);            
          }   
          
          // CRC32
          target_size = (4 + (Math.pow(2,this.color_depth)*3));
          crc32 = Zlib.CRC32.calc(F.Stream,F.getFileSize()-target_size,target_size);    
          F.WriteDWord_Big(crc32);                
         }   
         
        // -------------------------
        //  透明(省略可能)
        // -------------------------
        if (typeof r !== "undefined" && 
            typeof g !== "undefined" &&
            typeof b !== "undefined") {

            // 24bit          
            if (this.color_depth == 24){

              // チャンクデータのサイズ
              F.WriteDWord_Big(2*3);

              // tRSN
              F.WriteByte(0x74);
              F.WriteByte(0x52);
              F.WriteByte(0x4E);
              F.WriteByte(0x53);
              
              // 指定された色を透明にする
              F.WriteWord_Big(r);
              F.WriteWord_Big(g);
              F.WriteWord_Big(b);
            
              // CRC32
              target_size = (4 + 2*3);
              crc32 = Zlib.CRC32.calc(F.Stream,F.getFileSize()-target_size,target_size);    
              F.WriteDWord_Big(crc32);  
                          
            // 1-8bit  
            }else if (this.color_depth != 24){
              
              // チャンクデータのサイズ
              F.WriteDWord_Big(Math.pow(2,this.color_depth));

              // tRSN
              F.WriteByte(0x74);
              F.WriteByte(0x52);
              F.WriteByte(0x4E);
              F.WriteByte(0x53);
             
              // 一致する色を透明にする
              for (var i = 0; i < this.palette.length; i++) {
                 if(r == this.palette[i].r &&
                    g == this.palette[i].g &&
                    b == this.palette[i].b){                 
                    F.WriteByte(0); 
                 }else{
                    F.WriteByte(255);
                 }
              }  
                  
              // 不足分のパレット
              for (var i = this.palette.length ; i < Math.pow(2,this.color_depth); i++) {
                 F.WriteByte(255);          
              }             
                            
              // CRC32
              target_size = (4 + (Math.pow(2,this.color_depth)));
              crc32 = Zlib.CRC32.calc(F.Stream,F.getFileSize()-target_size,target_size);    
              F.WriteDWord_Big(crc32);                     
            }
        }
                 
        // -------------------------
        //  IDAT(可変)
        // -------------------------         
        var P = this._WriteImageData();

        // Deflate圧縮
        var deflate = new Zlib.Deflate(P);
        var compressed = deflate.compress();          
                
        // チャンクデータのサイズ
        F.WriteDWord_Big(compressed.length);
         
        // IDAT
        F.WriteByte(0x49);
        F.WriteByte(0x44);
        F.WriteByte(0x41);
        F.WriteByte(0x54);
 
        F.WriteStream(compressed);
        
        // CRC32
        target_size = (4+compressed.length);
        crc32 = Zlib.CRC32.calc(F.Stream,F.getFileSize()-target_size,target_size);    
        F.WriteDWord_Big(crc32);               
        
        // -------------------------
        //  IEND(12byte)
        // -------------------------
         
        // チャンクデータのサイズ(常に0)
        F.WriteDWord_Big(0);
         
        // IEND
        F.WriteByte(0x49);
        F.WriteByte(0x45);
        F.WriteByte(0x4E);
        F.WriteByte(0x44);        
  
        // CRC32
        crc32 = Zlib.CRC32.calc(F.Stream,F.getFileSize()-4,4);     
        F.WriteDWord_Big(crc32);  
                 
       return F;
    },    
    
    // PNGファイルの生成     
    // FileName : ファイル名
    // r,g,b    : 背景を透明にする色(省略可能)     
    SaveToFile: function (FileName,r,g,b) {
      var F = this.SaveToStream(r,g,b);
    
      // ファイルをダウンロード             
      F.SaveToFile(FileName,"image/png");   
    }            
}  
