// src/pages/MenuPage/MenuPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { client, urlFor } from '../../sanityClient';
import styles from './MenuPage.module.css';

const MenuPage = () => {
    const { slug } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [groupedMenu, setGroupedMenu] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMenu = async () => {
            setIsLoading(true);
            const query = `*[_type == "restaurant" && slug.current == $slug][0]{
                ...,
                "menuItems": *[_type == "menuItem" && references(^._id)] {
                    ...,
                    "categories": categories[]->{_id, title}
                }
            }`;
            const data = await client.fetch(query, { slug });
            
            if (data) {
                setRestaurant(data);
                // Group menu items by category
                const groups = data.menuItems.reduce((acc, item) => {
                    const categoryTitle = item.categories?.[0]?.title || 'General';
                    (acc[categoryTitle] = acc[categoryTitle] || []).push(item);
                    return acc;
                }, {});
                setGroupedMenu(groups);
            }
            setIsLoading(false);
        };
        fetchMenu();
    }, [slug]);

    if (isLoading) return <div className="page-wrapper container"><h1>Loading menu...</h1></div>;
    if (!restaurant) return <div className="page-wrapper container"><h1>Restaurant not found.</h1></div>;

    return (
        <div className={`${styles.menuPage} page-wrapper container`}>
            <div className={styles.restaurantHeader}>
                {restaurant.logo && <img src={urlFor(restaurant.logo).width(120).url()} alt={restaurant.name} />}
                <h1>{restaurant.name}</h1>
                <p>{restaurant.description}</p>
            </div>

            {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category} className={styles.categorySection}>
                    <h2>{category}</h2>
                    <div className={styles.itemsGrid}>
                        {items.map(item => (
                            <div key={item._id} className={styles.menuItemCard}>
                                <div className={styles.cardImage}>
                                    <img src={item.image ? urlFor(item.image).width(300).url() : 'https://placehold.co/300'} alt={item.name} />
                                </div>
                                <div className={styles.cardContent}>
                                    <h3>{item.name}</h3>
                                    <p className={styles.itemDescription}>{item.description}</p>
                                    <div className={styles.cardFooter}>
                                        <span className={styles.itemPrice}>Rs. {item.price.toFixed(2)}</span>
                                        <button className={styles.addButton}>Add to Cart</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MenuPage;