# ps
html5 select image clip image

support mobile touch 

prerequisites:  fabricjs.com 

http://fabricjs.com/build/
add Gestures 
for wechat android ，you should fix run long time,will timeout, 
please view https://github.com/kangax/fabric.js/issues/3817

or android wechat, touch will timout,

should add e.preventDefault() in __gesturesRenderer

code:

__gesturesRenderer: function() {

         if (this.__gesturesParams === null || this._currentTransform === null) {
             return;
         }

         var self = this.__gesturesParams.self,
             t = this._currentTransform,
             e = this.__gesturesParams.e;

         e.preventDefault();  // should add 

         t.action = 'scale';
         t.originX = t.originY = 'center';
         this._setOriginToCenter(t.target);

         this._scaleObjectBy(self.scale, e);

         if (self.rotation !== 0) {
             t.action = 'rotate';
             this._rotateObjectByAngle(self.rotation, e);
         }

         this._setCenterToOrigin(t.target);

         this.renderAll();

         t.action = 'drag';
     },
     
     
     
     
     add gesture support,

对于微信android 版本需要 将fabricjs 中 gesture部分修改一下，不然会timeout
具体参见：kangax/fabric.js#3817

使用说明：

var screen_info = {
shape_type: 0,
width: 100,,
height: 100
};

ps = new PS.Editor({
container: 'container',  //为放置 canvas的div
operation: 'clip_img',
screen_info: screen_info,
img_src: data_url
});

var _dataurl = ps.getClipImage();
 
