import React from 'react';

import './BranchBusinessOrderCreatePage.css';

export function BranchBusinessOrderCreatePage(): React.JSX.Element {
  return (
    <section className="ops-branch-order-create">
      <article className="ops-branch-order-create__panel">
        <header className="ops-branch-order-create__panel-header">
          <h2>
            Thong tin co ban
            <span aria-hidden="true">&#128274;</span>
          </h2>
          <button
            type="button"
            className="ops-branch-order-create__collapse-btn"
            aria-label="Thu gon thong tin co ban"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 14 5-5 5 5" />
            </svg>
          </button>
        </header>

        <form
          className="ops-branch-order-create__form"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Loai van don
            </span>
            <select defaultValue="bill-dien-tu">
              <option value="bill-dien-tu">Bill dien tu</option>
              <option value="bill-giay">Bill giay</option>
            </select>
          </label>

          <label className="ops-branch-order-create__field">
            <span>Ma van don</span>
            <input type="text" placeholder="" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Nhan vien giao nhan
            </span>
            <input type="text" defaultValue="Nguyen T Thuy Huong (" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>Phan loai san pham</span>
            <select defaultValue="express">
              <option value="express">EXPRESS</option>
              <option value="normal">NORMAL</option>
            </select>
          </label>

          <label className="ops-branch-order-create__field ops-branch-order-create__field--error">
            <span>
              <i>*</i> Ten KH ky hop dong
            </span>
            <input type="text" defaultValue="23" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Phuong thuc dich vu
            </span>
            <select defaultValue="tu-den-lay">
              <option value="tu-den-lay">Tu den lay</option>
              <option value="lay-tan-noi">Lay tan noi</option>
            </select>
          </label>

          <label className="ops-branch-order-create__field">
            <span>Phuong thuc van chuyen</span>
            <select defaultValue="">
              <option value="">Vui long chon</option>
              <option value="duong-bo">Duong bo</option>
              <option value="duong-khong">Duong khong</option>
            </select>
          </label>

          <label className="ops-branch-order-create__field">
            <span>T/G gui</span>
            <input type="text" placeholder="Chon thoi gian" />
          </label>

          <label className="ops-branch-order-create__checkbox">
            <input type="checkbox" />
            <span>Giao 1 phan</span>
          </label>
        </form>
      </article>

      <article className="ops-branch-order-create__panel">
        <header className="ops-branch-order-create__panel-header">
          <h2>
            Thong tin nguoi gui
            <span aria-hidden="true">&#128274;</span>
          </h2>
          <button
            type="button"
            className="ops-branch-order-create__collapse-btn"
            aria-label="Thu gon thong tin nguoi gui"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m7 14 5-5 5 5" />
            </svg>
          </button>
        </header>

        <form
          className="ops-branch-order-create__form ops-branch-order-create__form--sender"
          onSubmit={(event) => event.preventDefault()}
        >
          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Ten nguoi gui
            </span>
            <input type="text" defaultValue="N-INSUARANCE" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              So dien thoai
              <em className="ops-branch-order-create__hint" aria-hidden="true">
                ?
              </em>
            </span>
            <input type="text" defaultValue="0585240408" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              So dien thoai co dinh
              <em className="ops-branch-order-create__hint" aria-hidden="true">
                ?
              </em>
            </span>
            <input type="text" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Tinh gui hang
            </span>
            <input type="text" defaultValue="Ho Chi Minh" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Thanh pho gui hang
            </span>
            <input type="text" defaultValue="Huyen Cu Chi" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Quan gui hang
            </span>
            <input type="text" defaultValue="Thi tran Cu Chi-028HCCI" />
          </label>

          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>
              <i>*</i> Dia chi
            </span>
            <input type="text" defaultValue="123 ABC" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>Xuat phat</span>
            <input type="text" defaultValue="Thi tran Cu Chi-028HCC001" />
          </label>

          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>Dia chi cong ty</span>
            <input type="text" placeholder="Dia chi cong ty" />
          </label>
        </form>
      </article>
    </section>
  );
}
