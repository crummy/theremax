export class BinarySearchTreeNode<T> {
    data: T;
    leftNode?: BinarySearchTreeNode<T>;
    rightNode?: BinarySearchTreeNode<T>;

    constructor(data: T) {
        this.data = data;
    }
}

export class BinarySearchTree<T> {
    root?: BinarySearchTreeNode<T>;
    comparator: (a: T, b: T) => number;

    constructor(comparator: (a: T, b: T) => number) {
        this.comparator = comparator;
    }

    insert(data: T): BinarySearchTreeNode<T> | undefined {
        if (!this.root) {
            this.root = new BinarySearchTreeNode(data);
            return this.root;
        }

        let current = this.root;

        while (true) {
            if (this.comparator(data, current.data) === 1) {
                if (current.rightNode) {
                    current = current.rightNode;
                } else {
                    current.rightNode = new BinarySearchTreeNode(data);
                    return current.rightNode;
                }
            } else {
                if (current.leftNode) {
                    current = current.leftNode;
                } else {
                    current.leftNode = new BinarySearchTreeNode(data);
                    return current.leftNode;
                }
            }
        }
    }

    search(data: T): BinarySearchTreeNode<T> | undefined {
        if (!this.root) return undefined;

        let current = this.root;

        while (this.comparator(data, current.data) !== 0) {
            if (this.comparator(data, current.data) === 1) {
                if (!current.rightNode) return current;

                current = current.rightNode;
            } else {
                if (!current.leftNode) return current;

                current = current.leftNode;
            }
        }

        return current;
    }
}

function comparator(a: number, b: number) {
    if (a < b) return -1;

    if (a > b) return 1;

    return 0;
}