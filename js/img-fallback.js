/* =====================================================
   图片兜底：还没导入的剧照 / 照片
   -----------------------------------------------------
   各站的图片位都已经画好了底纹与图注（.album-thumb、.wall-item、
   .feed-images、.lyl-photo-card、.image-block 里的说明行…），
   图注本身就在说明「这里本该有什么」。
   但图片文件还没到位时，浏览器会在底纹上压一个破图图标 + alt 文字，
   整页看起来像没做完。这里只做一件事：把加载失败的 <img> 藏起来，
   露出各站自己画的底纹与图注。图片补进来以后，这段代码什么都不会做。

   为什么用 visibility 而不是 display：这些图片位的高度由外层容器
   （.album-thumb / .wall-item / .profile-cover）决定，display:none
   会让占位框塌掉；visibility:hidden 保留版面，只是不画破图。
   为什么保留 alt：读屏软件仍然需要知道这里是一张什么照片。
===================================================== */

(function () {
    'use strict';

    function hide(img) {

        if (img.classList.contains('img-missing')) {
            return;
        }

        img.classList.add('img-missing');
        img.style.visibility = 'hidden';
    }

    function watch(img) {

        // 已经判定过加载结果
        if (img.complete) {
            if (img.naturalWidth === 0) {
                hide(img);
            }
            return;
        }

        img.addEventListener('error', function () { hide(img); });
    }

    function scan(root) {

        var list = (root || document).querySelectorAll('img');
        var i;

        for (i = 0; i < list.length; i++) {
            watch(list[i]);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { scan(document); });
    } else {
        scan(document);
    }

    // 有些图片是脚本稍后插进来的（头像、评论配图），结束前再扫一遍
    window.addEventListener('load', function () { scan(document); });

}());
