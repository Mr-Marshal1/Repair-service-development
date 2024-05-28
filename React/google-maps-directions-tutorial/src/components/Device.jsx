import "./Device.css";

export default function Device(){
    return (
        <div className="Device">
            <div className="header">
                <p>Перелік основних видів девайсів, на ремонті яких ми спеціалізуємось</p>
            </div>
            <div className="innerDevice">
                <div className="airpods">
                    <img src="/airpods.png" alt="airpods" />
                    <p>Air Pods</p>
                </div>
                <div className="android">
                    <img src="/android.png" alt="airpods" />
                    <p>Смартфони на базі Android</p>
                </div>
                <div className="computer">
                    <img src="/computer.png" alt="airpods" />
                    <p>Стаціонарні комп'ютери</p>
                </div>
                <div className="macbook">
                    <img src="/macbook.png" alt="airpods" />
                    <p>Macbook та інші лептопи</p>
                </div>
                <div className="ps4">
                    <img src="/ps4.png" alt="airpods" />
                    <p>Ігрові приставки</p>
                </div>
                <div className="iphone">
                    <img src="/iphone.png" alt="airpods" />
                    <p>Смартфоні на базі Apple</p>
                </div>
            </div>
        </div>
    )
}