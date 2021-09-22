/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */

class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = this.formatNotes(notes);
  }

  set startAt(val) {
    if (val instanceof Date && !isNaN(val)) this._startAt = val
    else throw new Error("You need to enter a valid date to make a reservation.");
  };

  get startAt() {
    return this._startAt;
  }

  set numGuests(val) {
    if (val < 1) throw new Error("You must have at least one person attending.");
    this._numGuests = val;
  }

  get numGuests() {
    return this._numGuests;
  }

  formatNotes(notes) {
    const badValues = ['false', '0', 'undefined', 'null'];
    if (badValues.includes(notes)) return ' ';
    return notes;
  }

  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }
  async save() {
    if (this.id === undefined) {
      const query = await db.query(
        `INSERT INTO reservations
         (customer_id, num_guests, start_at, notes)
         VALUES
         ($1, $2, $3, $4)
         RETURNING id, customer_id, num_guests, start_at, notes`,
         [this.customerId, this.numGuests, this.startAt, this.notes]
      )
      this.id = query.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations
         SET customer_id=$1, num_guests=$2, start_at=$3, notes=$4
         WHERE id =$5`,
         [this.customerId, this.numGuests, this.startAt, this.notes, this.id]
      );
    };
  };
  static async getMostReservations() {
    const results = await db.query(
      `SELECT CONCAT(first_name, ' ', last_name) AS name, COUNT(*)
       FROM customers
       JOIN reservations
       ON customers.id = reservations.customer_id
       GROUP BY last_name, first_name
       ORDER BY COUNT(*) DESC
       LIMIT 10`
    );
    return results.rows;
  }
};


module.exports = Reservation;
