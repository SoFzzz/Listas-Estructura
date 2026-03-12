export class Node<T> {
  data: T;
  next: Node<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

export class LinkedList<T> {
  head: Node<T> | null = null;
  tail: Node<T> | null = null;
  size: number = 0;

  append(data: T): void {
    const newNode = new Node(data);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      if (this.tail) {
        this.tail.next = newNode;
        this.tail = newNode;
      }
    }
    this.size++;
  }

  find(predicate: (data: T) => boolean): Node<T> | null {
    let current = this.head;
    while (current) {
      if (predicate(current.data)) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  remove(predicate: (data: T) => boolean): boolean {
    if (!this.head) return false;

    if (predicate(this.head.data)) {
      this.head = this.head.next;
      if (!this.head) {
        this.tail = null;
      }
      this.size--;
      return true;
    }

    let current = this.head;
    while (current.next) {
      if (predicate(current.next.data)) {
        if (current.next === this.tail) {
          this.tail = current;
        }
        current.next = current.next.next;
        this.size--;
        return true;
      }
      current = current.next;
    }

    return false;
  }

  update(predicate: (data: T) => boolean, updateFn: (data: T) => T): boolean {
    const node = this.find(predicate);
    if (node) {
      node.data = updateFn(node.data);
      return true;
    }
    return false;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }
}
