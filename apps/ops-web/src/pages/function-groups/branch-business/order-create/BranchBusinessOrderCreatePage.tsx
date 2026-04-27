import React from 'react';

import './BranchBusinessOrderCreatePage.css';

export function BranchBusinessOrderCreatePage(): React.JSX.Element {
  return (
    <section className="ops-branch-order-create">
      <article className="ops-branch-order-create__panel">
        <header className="ops-branch-order-create__panel-header">
          <h2>
            Thông tin cơ bản
            <span aria-hidden="true">&#128274;</span>
          </h2>
          <button
            type="button"
            className="ops-branch-order-create__collapse-btn"
            aria-label="Thu gọn thông tin cơ bản"
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
              <i>*</i> Loại vận đơn
            </span>
            <select defaultValue="bill-dien-tu">
              <option value="bill-dien-tu">Bill điện tử</option>
              <option value="bill-giay">Bill giấy</option>
            </select>
          </label>

          <label className="ops-branch-order-create__field">
            <span>Mã vận đơn</span>
            <input type="text" placeholder="" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Nhân viên giao nhận
            </span>
            <input type="text" defaultValue="Nguyễn T Thùy Hương (" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>Phân loại sản phẩm</span>
            <select defaultValue="express">
              <option value="express">EXPRESS</option>
              <option value="normal">NORMAL</option>
            </select>
          </label>

          <label className="ops-branch-order-create__field ops-branch-order-create__field--error">
            <span>
              <i>*</i> Tên KH ký hợp đồng
            </span>
            <input type="text" defaultValue="23" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Phương thức dịch vụ
            </span>
            <select defaultValue="tu-den-lay">
              <option value="tu-den-lay">Tự đến lấy</option>
              <option value="lay-tan-noi">Lấy tận nơi</option>
            </select>
          </label>

          <label className="ops-branch-order-create__field">
            <span>Phương thức vận chuyển</span>
            <select defaultValue="">
              <option value="">Vui lòng chọn</option>
              <option value="duong-bo">Đường bộ</option>
              <option value="duong-khong">Đường không</option>
            </select>
          </label>

          <label className="ops-branch-order-create__field">
            <span>T/G gửi</span>
            <input type="text" placeholder="Chọn thời gian" />
          </label>

          <label className="ops-branch-order-create__checkbox">
            <input type="checkbox" />
            <span>Giao 1 phần</span>
          </label>
        </form>
      </article>

      <article className="ops-branch-order-create__panel">
        <header className="ops-branch-order-create__panel-header">
          <h2>
            Thông tin người gửi
            <span aria-hidden="true">&#128274;</span>
          </h2>
          <button
            type="button"
            className="ops-branch-order-create__collapse-btn"
            aria-label="Thu gọn thông tin người gửi"
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
              <i>*</i> Tên người gửi
            </span>
            <input type="text" defaultValue="N-INSUARANCE" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              Số điện thoại
              <em className="ops-branch-order-create__hint" aria-hidden="true">
                ?
              </em>
            </span>
            <input type="text" defaultValue="0585240408" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              Số điện thoại cố định
              <em className="ops-branch-order-create__hint" aria-hidden="true">
                ?
              </em>
            </span>
            <input type="text" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Tỉnh gửi hàng
            </span>
            <input type="text" defaultValue="Hồ Chí Minh" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Thành phố gửi hàng
            </span>
            <input type="text" defaultValue="Huyện Củ Chi" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>
              <i>*</i> Quận gửi hàng
            </span>
            <input type="text" defaultValue="Thị trấn Củ Chi-028HCCI" />
          </label>

          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>
              <i>*</i> Địa chỉ
            </span>
            <input type="text" defaultValue="123 ABC" />
          </label>

          <label className="ops-branch-order-create__field">
            <span>Xuất phát</span>
            <input type="text" defaultValue="Thị trấn Củ Chi-028HCC001" />
          </label>

          <label className="ops-branch-order-create__field ops-branch-order-create__field--wide">
            <span>Địa chỉ công ty</span>
            <input type="text" placeholder="Địa chỉ công ty" />
          </label>
        </form>
      </article>
    </section>
  );
}
