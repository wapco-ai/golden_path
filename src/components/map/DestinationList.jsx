const DestinationList = ({ onSelect, onClose }) => {
  // Sample recent searches data (you can fetch this from your backend)
  const recentSearches = [
    { name: 'پنجره فوالد', description: 'حرم مطهر امام رضا علیه السلام، صحن انقلاب' },
    { name: 'ایوان طلا', description: 'حرم مطهر امام رضا علیه السلام، بین طبرسی و...' },
    { name: 'رواق حضرت معصومه «س»', description: 'حرم مطهر امام رضا علیه السلام، صحن آیت الله...' },
    { name: 'مسجد جامع گوهرشاد', description: 'حرم مطهر امام رضا علیه السلام، صحن گوهرشاد' },
    { name: 'صحن پیامبر اعظم', description: 'حرم مطهر امام رضا علیه السلام، صحن پیامبر...' }
  ];

  return (
    <div className="destination-list">
      <div className="destination-list-header">
        <h3>جستجوهای اخیر شما</h3>
      </div>
      <div className="destination-items">
        {recentSearches.map((search, index) => (
          <div 
            key={index} 
            className="destination-item"
            onClick={() => onSelect({
              name: search.name,
              lat: 36.2880 + (Math.random() * 0.01 - 0.005), // Sample coordinates
              lng: 59.6157 + (Math.random() * 0.01 - 0.005)   // around Imam Reza shrine
            })}
          >
            <div className="destination-name">{search.name}</div>
            <div className="destination-description">{search.description}</div>
          </div>
        ))}
      </div>
      <button className="close-button" onClick={onClose}>
        بستن
      </button>
    </div>
  );
};

export default DestinationList;