<script setup lang="ts">
import { useTerm } from '../composables/useTerm'
import { TERMS } from '../data/terms'
import { HOLDER, LICENSE, paintingLabel, paintingOfPlate, paintingPage, plateOfTerm } from '../data/paintings'
import { SOLAR_TERM_FIRST_YEAR, SOLAR_TERM_LAST_YEAR } from '../data/solarTermDates'
import { edgeOf, isLight } from '../utils/color'

/**
 * 关于页：项目说明、色名与取色、画作来源与许可、字体与许可、日期算法、已知的局限。
 * 画作清单直接从 paintings.ts 汇出，改了配画这里自动跟着变。
 */
const { backToToday } = useTerm()
backToToday()

const pad = (n: number) => String(n).padStart(2, '0')

const plates = TERMS.map((term) => {
  const plate = plateOfTerm(term.index)
  const painting = plate ? paintingOfPlate(plate) : undefined
  return {
    term,
    hex: term.color.hex,
    edge: isLight(term.color.hex) ? edgeOf(term.color.hex) : 'transparent',
    label: painting ? paintingLabel(painting) : '',
    acc: painting?.acc ?? '',
    href: painting ? paintingPage(painting) : '',
  }
})

const fonts = [
  { name: '岁时宋', latin: 'Suishi Song', use: '全站文字，常规与特粗两个字重' },
  { name: '思源宋体', latin: 'Noto Serif SC', use: '岁时宋的字形骨架' },
]

const span = `${SOLAR_TERM_FIRST_YEAR}–${SOLAR_TERM_LAST_YEAR}`
const itemCount = (SOLAR_TERM_LAST_YEAR - SOLAR_TERM_FIRST_YEAR + 1) * 24
</script>

<template>
  <article class="about" aria-labelledby="about-title">
    <header class="wrap about__head">
      <p class="about__eyebrow">关于</p>
      <h1 id="about-title" class="about__title">岁时有色</h1>
      <p class="lede">二十四节气，二十四种中国传统色。这一页写明颜色、画作、字体和日期各自从哪里来。</p>
    </header>

    <div class="wrap about__body">
      <section v-reveal class="row" aria-labelledby="a-what">
        <h2 id="a-what" class="row__title">这个网站</h2>
        <div class="row__text">
          <p>
            岁时有色把二十四节气和二十四种传统色配成对：每个节气一种颜色，到了哪个节气，整个页面就换成那个节气的颜色。
          </p>
          <p>
            首页的岁时轮停在今天所在的节气；点任意一个节气，可以读到它的三候、一首应景的古诗、这一色的色值，以及配给它的一幅古画。
          </p>
          <p>
            <RouterLink class="link" :to="{ name: 'palette' }">看二十四色色谱<span aria-hidden="true">→</span></RouterLink>
          </p>
        </div>
      </section>

      <section v-reveal class="row" aria-labelledby="a-color">
        <h2 id="a-color" class="row__title">色名与色值</h2>
        <div class="row__text">
          <p>
            二十四个色名都是通行的传统色名，哪个节气配哪种颜色是这个网站拟定的。HEX 与 RGB 是为屏幕拟定的近似值：同一个色名在不同典籍和色谱里取值并不统一，这里取的是看上去最贴合名字的一种，印在纸上会有出入。
          </p>
          <p>
            每个节气页另有浅色、深色和压在主色上的文字色，是按主色推算出来的，用来保证文字读得清楚，并不是古已有之的辅色。
          </p>
        </div>
      </section>

      <section v-reveal class="row" aria-labelledby="a-art">
        <h2 id="a-art" class="row__title">画作与许可</h2>
        <div class="row__text">
          <p>
            二十四幅画都来自{{ HOLDER }}（The Cleveland Museum of Art）的开放藏品。馆方以 Open Access 方式开放，图像为
            <span class="latin">{{ LICENSE }}</span>，可以自由使用。
          </p>
          <p>
            配画先看题材：画的是这个节气的物候、花木或景致，才配给这个节气，颜色对不对得上不作为条件，寒露是唯一的例外，配的是颜色。画中的取色点是用程序在画里的主体（花、叶、果、雪）上找出的、最接近节气色的一处，绢和纸的底子不算，页面上会写明取的是什么；差多少，页面上就写多少。画上带数字的小圆点标的是画里对得上这个节气的物候，画里真画了的才链到三候里的某一候，没画到的不硬配。
          </p>
          <p class="note">
            题名照录馆方的中文题名（转为简体），没有的据英文题名意译，不一定是画上原题。网页用图裁掉了裱边，几幅长立轴只截取了一段。
          </p>

          <ol class="plates">
            <li v-for="p in plates" :key="p.term.index" class="plate">
              <span class="plate__no latin" aria-hidden="true">{{ pad(p.term.index) }}</span>
              <span class="plate__term">
                <i :style="{ background: p.hex, '--edge': p.edge }" aria-hidden="true"></i>
                <RouterLink :to="{ name: 'term', params: { slug: p.term.slug } }">{{ p.term.name }}</RouterLink>
              </span>
              <span class="plate__work">
                {{ p.label }}
                <a
                  v-if="p.href"
                  class="plate__acc latin"
                  :href="p.href"
                  target="_blank"
                  rel="noopener"
                  :aria-label="`在${HOLDER}官网查看 ${p.acc}（新窗口）`"
                  >{{ p.acc }}</a
                >
              </span>
            </li>
          </ol>
        </div>
      </section>

      <section v-reveal class="row" aria-labelledby="a-font">
        <h2 id="a-font" class="row__title">字体与许可</h2>
        <div class="row__text">
          <p>
            全站只用一种字体：为本站自制的“岁时宋”。它以思源宋体为骨架，用脚本把每一笔改成铅字压印的样子——笔画交接处积一点墨，起笔收笔的尖角洇成圆角，汉字字面略收窄；只收本站用到的约一千五百个字，按页面分成小包，用到才下载。
          </p>
          <p>岁时宋随思源宋体一起以 SIL 开放字体许可（OFL 1.1）发布，随网站一起打包，不依赖外部的字体服务。</p>
          <dl class="fonts">
            <div v-for="f in fonts" :key="f.name" class="font">
              <dt>
                {{ f.name }}<span v-if="f.latin" class="latin">{{ f.latin }}</span>
              </dt>
              <dd>{{ f.use }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section v-reveal class="row" aria-labelledby="a-date">
        <h2 id="a-date" class="row__title">节气日期</h2>
        <div class="row__text">
          <p>
            “今日节气”按公历日期推算，交节当天算这个节气的第 1 天。交节的时刻用 Meeus《天文算法》第 25 章的方法，由太阳视黄经每走 15° 算出，换成北京时间（UTC+8）后取日期，做成
            <span class="latin">{{ span }}</span>
            年的逐年表，并与独立的开源历法库 lunar-javascript 逐项核对：<span class="latin">{{ itemCount }}</span>
            项，日期全部一致。
          </p>
          <p>
            超出这个年份范围，就退回到各节气固定的大致日期，可能差一天。页面上“2 月 3—5 日”这样的区间是“前后”的说法，不是精确日期。在北京时间以外的地方，“今天”以设备上的日期为准。
          </p>
        </div>
      </section>

      <section v-reveal class="row" aria-labelledby="a-limit">
        <h2 id="a-limit" class="row__title">局限与勘误</h2>
        <div class="row__text">
          <ul class="limits">
            <li>
              网址里带 <span class="latin">#</span>，分享出去的链接预览只显示网站的总封面，不显示具体的节气。
            </li>
            <li>物候与习俗各地不同，页面上的写法只是一种常见的概括。</li>
            <li>色值是近似值，见上文“色名与色值”。</li>
          </ul>
          <p>发现色值、日期或文字有误，欢迎来信指出：<a class="latin" href="mailto:sjgforoverseas@gmail.com?subject=岁时有色%20勘误">sjgforoverseas@gmail.com</a>。信里写明是哪个节气、哪一处，核实后会修订。这是一个课程作品，内容还会修订。</p>
        </div>
      </section>
    </div>
  </article>
</template>

<style scoped>
.about__head {
  display: grid;
  gap: var(--sp-2);
  padding-block: 168px var(--sp-6);
}
.about__eyebrow {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--fs-14);
  letter-spacing: 0.2em;
  color: var(--ink-2);
}
.about__title {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(2.75rem, 7vw, 5.5rem);
  line-height: 1.15;
  letter-spacing: 0.06em;
}

.about__body {
  padding-bottom: clamp(72px, 11vw, 152px);
}

/* 每一节：左边小标题，右边正文，上面一条墨线，像书末的版权页 */
.row {
  display: grid;
  grid-template-columns: minmax(0, 4fr) minmax(0, 8fr);
  column-gap: clamp(32px, 6vw, 96px);
  padding-block: var(--sp-6);
  border-top: 1px solid var(--ink);
}
.row__title {
  align-self: start;
  font-family: var(--font-display);
  font-weight: 900;
  font-size: clamp(1.5rem, 2.6vw, var(--fs-28));
  line-height: 1.4;
  letter-spacing: 0.08em;
}
.row__text {
  display: grid;
  gap: var(--sp-2);
  max-width: 40em;
  line-height: 1.95;
}
.row__text > p,
.row__text > ul {
  max-width: 36em;
}
.note {
  font-size: var(--fs-14);
  color: var(--ink-2);
}

/* 二十四幅画 */
.plates {
  margin-top: var(--sp-2);
  max-width: none;
  border-top: 1px solid var(--line);
}
.plate {
  display: grid;
  grid-template-columns: 2.25rem 6.5rem minmax(0, 1fr);
  align-items: baseline;
  column-gap: var(--sp-2);
  padding-block: 12px;
  border-bottom: 1px solid var(--line);
  line-height: 1.7;
}
.plate__no {
  font-size: var(--fs-14);
  letter-spacing: 0.1em;
  color: var(--ink-2);
}
.plate__term {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.1em;
}
.plate__term i {
  flex: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px var(--edge);
  /* 悬在文字基线之上一点，和字的视觉中心对齐 */
  translate: 0 1px;
}
.plate__term a {
  padding-block: 4px;
  border-bottom: 1px solid transparent;
  transition: border-color 0.25s;
}
.plate__term a:hover {
  border-color: currentColor;
}
.plate__work {
  font-size: var(--fs-14);
  letter-spacing: 0.04em;
}
.plate__acc {
  display: inline-block;
  margin-left: 0.8em;
  padding-block: 4px;
  border-bottom: 1px solid var(--line);
  color: var(--ink-2);
  letter-spacing: 0.04em;
  transition:
    color 0.25s,
    border-color 0.25s;
}
.plate__acc:hover {
  color: var(--ink);
  border-color: currentColor;
}

/* 字体 */
.fonts {
  display: grid;
  margin: var(--sp-1) 0 0;
  border-top: 1px solid var(--line);
}
.font {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  column-gap: var(--sp-3);
  padding-block: 12px;
  border-bottom: 1px solid var(--line);
}
.font dt {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 0.8em;
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: 0.08em;
}
.font dt .latin {
  font-weight: 400;
  font-size: var(--fs-14);
  letter-spacing: 0.04em;
  color: var(--ink-2);
}
.font dd {
  margin: 0;
  font-size: var(--fs-14);
  letter-spacing: 0.08em;
  color: var(--ink-2);
}

.limits {
  display: grid;
  gap: 4px;
  padding-left: 1.2em;
  list-style: disc;
}
.limits li::marker {
  color: var(--ink-2);
}

@media (max-width: 860px) {
  .row {
    grid-template-columns: minmax(0, 1fr);
    row-gap: var(--sp-2);
  }
}

@media (max-width: 760px) {
  .about__head {
    padding-top: 128px;
  }
}

@media (max-width: 560px) {
  .plate {
    grid-template-columns: 2rem minmax(0, 1fr);
    row-gap: 2px;
  }
  .plate__work {
    grid-column: 2;
  }
  .font {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 2px;
  }
}
</style>
