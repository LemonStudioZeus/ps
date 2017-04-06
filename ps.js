/**
 * author frank.zhang
 * admininfor@gmail.com
 * 
 * js select image clip 
 */

var PS = { REVISION: '1' };

// browserify support

if (typeof module === 'object') {

    module.exports = PS;

}

/***************** Canvas *************************/

PS.Editor = function(option) {
    this.container = option.container || 'container';

    this.screen_info = option.screen_info;

    this.operation = option.operation || 'clip_img';

    this.mask_url = option.mask_url || null;
    this.bg_url = option.bg_url || null;
    this.bg_position = option.bg_position || null;

    var scope = this;

    this.init(
        function() {
            scope.addImage(option.img_src, function(obj_img) {

                if (scope.mask_url == null)
                    scope.addClipRect(obj_img);

                if (option.callback) {
                    var callback = option.callback;
                    callback();
                }
            });

        }
    );


};

PS.Editor.prototype = {
    constructor: PS.Editor,

    init: function(callback) {
        var scope = this;

        this.initCanvas();

        this.initCanvasEvent();
        if (this.mask_url) {
            this.setMaskImage(this.mask_url, function() {
                if (scope.bg_url) {
                    fabric.util.loadImage(scope.bg_url, function(img) {
                        scope.bg_image = img;

                        if (callback)
                            callback();

                    });
                } else {
                    if (callback)
                        callback();
                }
            });
        } else {
            if (callback)
                callback();
        }

    },

    initCanvas: function() {

        var scope = this;

        scope._canvas = document.createElement('canvas');

        scope.domElement = scope._canvas;

        var container = scope.container;

        scope.dom = document.getElementById(container);

        scope.dom.appendChild(scope.domElement);
        var onWindowResize = function(event) {
            scope.setSize(scope.dom.offsetWidth, scope.dom.offsetHeight, true);
            scope.render();
        };

        //window.addEventListener('resize', onWindowResize, false);

        onWindowResize();

        scope.canvas = new fabric.Canvas(scope._canvas, {
            selectionColor: 'rgba(0,255,255,0.2)',
            selectionLineWidth: 20,
            enableRetinaScaling: false,
            renderOnAddRemove: false,
            imageSmoothingEnabled: false,
            allowTouchScrolling: false
        });

        function animate() {
            if (scope.canvas)
                requestAnimationFrame(animate)

            scope.render();
            // console.log('animate')
        }
        animate();
    },

    initCanvasEvent: function() {
        var canvas = this.canvas;

        var scope = this;

        if (this.mask_url) {
            canvas.on('object:moving', function(o) {
                scope.ClipTo(o.target);
            }).on('object:scaling', function(o) {
                scope.ClipTo(o.target);
            }).on('object:rotating', function(o) {
                scope.ClipTo(o.target);
            }).on('object:modified', function(o) {
                scope.ClipTo(o.target);
            }).on('object:selected', function(o) {
                scope.ClipTo(o.target);
            });

        }

    },

    setSize: function(width, height, updateStyle) {
        var _canvas = this._canvas;

        _canvas.width = width;
        _canvas.height = height;

        if (updateStyle !== false) {

            _canvas.style.width = width + 'px';
            _canvas.style.height = height + 'px';

        }

    },

    render: function() {
        if (this.canvas)
            this.canvas.renderAll(true);

    },

    setBackgroundImage: function(url) {
        var scope = this;
        var canvas = this.canvas;

        canvas.setBackgroundImage(url, canvas.renderAll.bind(canvas), { originX: 'center', originY: 'center', left: canvas.width / 2, top: canvas.height / 2 });

    },

    setMaskImage: function(url, callback) {
        var scope = this;
        var canvas = this.canvas;

        fabric.Image.fromURL(url, function(img) {
            img.crossOrigin = 'anonymous'
            scope.ClipRect = {
                cx: canvas.width / 2,
                cy: canvas.height / 2,
                w: img.width,
                h: img.height
            }
            scope.mask_image = img;

            canvas.setOverlayImage(img, canvas.renderAll.bind(canvas), { originX: 'center', originY: 'center', left: canvas.width / 2, top: canvas.height / 2 });

            scope.clipToAll();
            if (callback)
                callback();
        });

        //canvas.setOverlayImage(url, canvas.renderAll.bind(canvas), { originX: 'center', originY: 'center', left: canvas.width / 2, top: canvas.height / 2 });

    },

    addImage: function(img_src, callback) {
        var scope = this;
        var canvas = this.canvas;

        fabric.Image.fromURL(img_src, function(img) {
            img.crossOrigin = 'anonymous'

            var scaleX = canvas.width / img.width;
            var scaleY = canvas.height / img.height;

            var scale = scaleX < scaleY ? scaleX : scaleY,
                scale = scale < 1 ? scale : 1;

            var obj_img = scope.getObjectByType('image');

            if (obj_img == null) {
                obj_img = img;

                canvas.add(obj_img);

            } else {
                // canvas.remove(obj_img);
                canvas.setActiveObject(obj_img);
                scope.removeSelected();

                canvas.add(img);
                obj_img = img;
            }

            obj_img.set({
                selectable: true, //false,
                scaleX: scale,
                scaleY: scale,
                //hasRotatingPoint: false,
                //lockRotation: true,
                //borderColor: 'yellow',
                //borderWidth: 20,
                transparentCorners: true,
                //cornerColor: 'green',
                lockScalingFlip: true,
                lockUniScaling: true,
                centeredScaling: true,
                hasControls: false,
                //originY: 'center',
                //originX: 'center'

            });

            obj_img.center().setCoords();

            canvas.sendToBack(obj_img);
            canvas.deactivateAllWithDispatch();
            canvas.setActiveObject(obj_img);

            scope.obj_img = obj_img;

            canvas.renderAll();

            if (callback) {
                callback(obj_img);
            }
        });

    },

    addClipRect: function(obj_img) {
        var canvas = this.canvas;

        var screen_info = this.screen_info;

        var scaleX = obj_img.width * obj_img.scaleX / screen_info.width;
        var scaleY = obj_img.height * obj_img.scaleY / screen_info.height;

        var scale = scaleX < scaleY ? scaleX : scaleY;
        //scale = scale < 1 ? scale : 1;

        scale = scale * 0.95;

        var width = screen_info.width * scale;

        var height = screen_info.height * scale;

        var rect = new fabric.Rect({
            left: canvas.width / 2, //0
            top: canvas.height / 2, //0
            fill: 'rgba(255,255,255,0.1)',
            width: width,
            height: height,
            hasRotatingPoint: false,
            lockRotation: true,
            //borderColor: 'yellow',
            //borderWidth: 20,
            selectable: false,
            stroke: 'red',
            strokeWidth: 2,
            strokeDashArray: [5],
            transparentCorners: true,
            lockUniScaling: true,
            centeredScaling: true,
            originX: 'center',
            originY: 'center'

        });


        this.ClipRect = rect;


        // "add" rectangle onto canvas
        //canvas.add(rect);
        canvas.setOverlayImage(rect);

        rect.center().setCoords();

        //canvas.deactivateAllWithDispatch();
        //canvas.setActiveObject(rect);

        //canvas.bringToFront(rect);

        canvas.renderAll();

    },

    getObjectByType: function(type) {
        var canvas = this.canvas;

        var object = null,
            objects = canvas.getObjects();

        for (var i = 0, len = canvas.size(); i < len; i++) {

            if (objects[i].get('type') == type) {
                object = objects[i];
                break;
            }
        }

        return object;
    },

    getClipImage_rect: function() {
        var canvas = this.canvas;

        var obj_img = this.obj_img;
        var ClipRect = this.ClipRect;

        ClipRect.visible = false;

        canvas.deactivateAllWithDispatch();

        obj_img.bringToFront();

        canvas.renderAll();

        var left = parseInt(ClipRect.oCoords.tl.x);
        var top = parseInt(ClipRect.oCoords.tl.y);

        var width = parseInt(ClipRect.oCoords.br.x - left);
        var height = parseInt(ClipRect.oCoords.br.y - top);

        //var multiplier = fabric.devicePixelRatio > 1 ? 1 : 1 / obj_img.scaleX;

        var multiplier = obj_img.scaleX < 1 ? 1 / obj_img.scaleX : 1;

        var dest_w = width * multiplier;
        var dest_h = height * multiplier;

        if (dest_w < 300 || dest_h < 300) {
            var scale_x = 300 / dest_w;
            var scale_y = 300 / dest_h;

            var scale = scale_x > scale_y ? scale_x : scale_y;

            multiplier *= scale;
        }

        var option = {
            format: 'jpeg',
            quality: 1.0,
            left: left,
            top: top,
            width: width,
            height: height,
            multiplier: multiplier

        };
        var dataurl = canvas.toDataURL(option);

        return dataurl;

    },

    getClipImage: function() {
        var dataurl = "",
            dataurl_bg = "";
        if (this.mask_url) {
            dataurl = this.blend();
            dataurl_bg = this.blendBg();
            this.dispose();
            return { dataurl: dataurl, dataurl_bg: dataurl_bg };
        } else {
            dataurl = this.getClipImage_rect();
            this.dispose();
            return dataurl;
        }
    },

    blend: function() {
        var scope = this;
        var obj_img = scope.obj_img,
            mask_image = scope.mask_image;

        var imgEl = obj_img.getElement(),
            maskEl = mask_image.getElement();

        var canvasEl = fabric.util.createCanvasElement();
        canvasEl.width = maskEl.width;
        canvasEl.height = maskEl.height;

        var ctx = canvasEl.getContext('2d');

        ctx.drawImage(imgEl, 0, 0, imgEl.width, imgEl.height, obj_img.left - mask_image.left + mask_image.width / 2, obj_img.top - mask_image.top + mask_image.height / 2, imgEl.width * obj_img.scaleX, imgEl.height * obj_img.scaleY);

        ctx.globalCompositeOperation = 'destination-out';

        ctx.drawImage(maskEl, 0, 0, maskEl.width, maskEl.height);

        var dataurl = canvasEl.toDataURL();

        canvasEl = null;

        return dataurl;

    },

    blendBg: function() {
        var scope = this;
        var obj_img = scope.obj_img,
            mask_image = scope.mask_image,
            bg_image = scope.bg_image,
            bg_position = scope.bg_position;

        var imgEl = obj_img.getElement(),
            maskEl = mask_image.getElement();

        var canvasEl = fabric.util.createCanvasElement();
        canvasEl.width = bg_image.width;
        canvasEl.height = bg_image.height;


        var p0 = new fabric.Point(bg_position.x, bg_position.y);
        var p1 = new fabric.Point(bg_position.x + maskEl.width, bg_position.y);
        var p2 = new fabric.Point(bg_position.x + maskEl.width, bg_position.y + maskEl.height);
        var p3 = new fabric.Point(bg_position.x, bg_position.y + maskEl.height);

        var ctx = canvasEl.getContext('2d');

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y); //left , top
        ctx.lineTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.lineTo(p3.x, p3.y);
        ctx.lineTo(p0.x, p0.y);
        ctx.closePath();
        ctx.clip();

        ctx.translate(bg_position.x + obj_img.left - mask_image.left + mask_image.width / 2, bg_position.y + obj_img.top - mask_image.top + mask_image.height / 2);
        ctx.rotate(fabric.util.degreesToRadians(obj_img.angle));
        ctx.scale(
            obj_img.scaleX * (obj_img.flipX ? -1 : 1),
            obj_img.scaleY * (obj_img.flipY ? -1 : 1)
        );
        ctx.transform(1, 0, Math.tan(fabric.util.degreesToRadians(obj_img.skewX)), 1, 0, 0);
        ctx.transform(1, Math.tan(fabric.util.degreesToRadians(obj_img.skewY)), 0, 1, 0, 0);
        ctx.drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);
        //ctx.drawImage(imgEl, 0, 0, imgEl.width, imgEl.height, bg_position.x + obj_img.left - mask_image.left + mask_image.width / 2, bg_position.y + obj_img.top - mask_image.top + mask_image.height / 2, imgEl.width * obj_img.scaleX, imgEl.height * obj_img.scaleY);
        ctx.restore();
        ctx.globalCompositeOperation = 'destination-out';

        ctx.drawImage(maskEl, 0, 0, maskEl.width, maskEl.height, bg_position.x, bg_position.y, maskEl.width, maskEl.height);

        ctx.globalCompositeOperation = 'destination-atop';
        ctx.drawImage(bg_image, 0, 0, bg_image.width, bg_image.height);

        var dataurl = canvasEl.toDataURL();

        canvasEl = null;

        return dataurl;

    },

    rotateImage: function(deg_plus) {

        var obj_img = this.obj_img;
        var canvas = this.canvas;

        if (obj_img) {

            var deg = (obj_img.angle + deg_plus) % 360;

            if (deg < 0)
                deg += 360;

            obj_img.set({
                angle: deg

            });

            if (deg == 90 || deg == 270) {

                var scaleX = canvas.height / obj_img.width;
                var scaleY = canvas.width / obj_img.height;

                var scale = scaleX < scaleY ? scaleX : scaleY,
                    scale = scale < 1 ? scale : 1;

                obj_img.set({
                    scaleX: scale,
                    scaleY: scale,

                });

            } else {

                var scaleX = canvas.width / obj_img.width;
                var scaleY = canvas.height / obj_img.height;

                var scale = scaleX < scaleY ? scaleX : scaleY,
                    scale = scale < 1 ? scale : 1;

                obj_img.set({
                    scaleX: scale,
                    scaleY: scale,

                });

            }

            obj_img.center().setCoords();

            this.render();
        }

    },

    dataURLtoBlob: function(dataurl) {
        /*
        var arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });*/

        var arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]);

        return new Blob([bstr], { type: mime });
    },
    ClipTo: function(obj) {
        if (this.ClipRect == undefined) {
            return
        }
        var p_c = new fabric.Point(obj.width / 2, obj.height / 2);
        var radians = fabric.util.degreesToRadians(obj.angle);

        var sin = Math.sin(radians),
            cos = Math.cos(radians);


        var p = obj._getLeftTopCoords();

        var matrixA = [obj.scaleX, 0,
            0, obj.scaleY,
            p.x, p.y
            //obj.left, obj.top,
        ];

        var matrixB = [cos, sin, -sin, cos,
            0, 0,
        ];

        //console.log(obj.angle, obj.left, obj.top, obj._getLeftTopCoords())
        var matrixC = fabric.util.multiplyTransformMatrices(matrixA, matrixB);

        var T = fabric.util.invertTransform(matrixC);

        var ClipRect = this.ClipRect;

        var cx = parseFloat(ClipRect.cx);
        var cy = parseFloat(ClipRect.cy);
        var w = parseFloat(ClipRect.w / 2);
        var h = parseFloat(ClipRect.h / 2);

        var p0 = new fabric.Point(cx - w, cy - h);
        var p1 = new fabric.Point(cx + w, cy - h);
        var p2 = new fabric.Point(cx + w, cy + h);
        var p3 = new fabric.Point(cx - w, cy + h);

        p0 = fabric.util.transformPoint(p0, T).subtract(p_c);
        p1 = fabric.util.transformPoint(p1, T).subtract(p_c);
        p2 = fabric.util.transformPoint(p2, T).subtract(p_c);
        p3 = fabric.util.transformPoint(p3, T).subtract(p_c);

        obj.clipTo = function(ctx) {
            ctx.beginPath();

            ctx.moveTo(p0.x, p0.y); //left , top
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.lineTo(p0.x, p0.y);

            ctx.closePath();
        };

        this.canvas.renderAll();
    },
    clipToAll: function() {
        var _this = this;
        var canvas = this.canvas;

        var objects = canvas.getObjects();

        for (var i = 0, len = canvas.size(); i < len; i++) {
            var obj = objects[i];
            _this.ClipTo(obj);
        }

        //canvas.renderAll();
    },

    dispose: function() {
        if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
        }
    }

};